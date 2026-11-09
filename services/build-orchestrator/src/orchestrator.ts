/**
 * Universal AI Builder - Build Orchestrator Engine
 *
 * Coordinates execution of build jobs in isolated Docker containers,
 * handles file mounting, log collection, artifact extraction, and cleanup.
 */

import fs from 'fs';
import path from 'path';
import { config } from './config';
import { validateSafePath, validateBuildId, validateProjectId } from './security';
import { pullImageIfNeeded, runContainer, removeContainer } from './docker-manager';
import { generateFlutterBuildCommand } from './builders/flutter-builder';
import { generateAndroidBuildCommand } from './builders/android-builder';
import { generateWebBuildCommand } from './builders/web-builder';
import { uploadArtifact, getDownloadUrl } from './storage';

export interface BuildJobRequest {
  buildId: string;
  projectId: string;
  userId?: string;
  type: 'apk' | 'aab' | 'web';
  projectType: string;
  files?: Array<{ path: string; content: string }>;
  options?: Record<string, any>;
}

export interface BuildJobStatus {
  buildId: string;
  projectId: string;
  type: string;
  status: 'queued' | 'building' | 'success' | 'failed' | 'cancelled';
  logs: string[];
  artifacts: Array<{
    id: string;
    filename: string;
    sizeBytes: number;
    downloadUrl: string;
    path: string;
  }>;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

export class BuildOrchestrator {
  private jobs: Map<string, BuildJobStatus> = new Map();

  constructor() {
    // Ensure base directories exist
    fs.mkdirSync(config.workspaceBasePath, { recursive: true });
    fs.mkdirSync(config.artifactBasePath, { recursive: true });
  }

  public getJob(buildId: string): BuildJobStatus | undefined {
    return this.jobs.get(buildId);
  }

  public getAllJobs(): BuildJobStatus[] {
    return Array.from(this.jobs.values());
  }

  public async executeBuild(request: BuildJobRequest): Promise<BuildJobStatus> {
    const buildId = validateBuildId(request.buildId);
    const projectId = validateProjectId(request.projectId);

    const jobStatus: BuildJobStatus = {
      buildId,
      projectId,
      type: request.type,
      status: 'building',
      logs: [`[Orchestrator] Starting build ${buildId} for project ${projectId} (${request.type})`],
      artifacts: [],
      startedAt: new Date().toISOString(),
    };
    this.jobs.set(buildId, jobStatus);

    const workspaceDir = path.join(config.workspaceBasePath, buildId);
    fs.mkdirSync(workspaceDir, { recursive: true });

    let containerId: string | undefined;

    try {
      // 1. Write project files into workspace
      if (request.files && request.files.length > 0) {
        jobStatus.logs.push(`[Workspace] Writing ${request.files.length} source file(s)...`);
        for (const file of request.files) {
          const destPath = validateSafePath(file.path, workspaceDir);
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.writeFileSync(destPath, file.content, 'utf-8');
        }
      }

      // 2. Select build configuration and command generator
      let buildCmd: { image: string; command: string[]; envVars: Record<string, string>; artifactPaths: string[] };

      if (request.projectType === 'flutter') {
        buildCmd = generateFlutterBuildCommand({
          buildType: request.type as 'apk' | 'aab',
          releaseMode: request.options?.release_mode !== false,
          flavor: request.options?.flavor,
          extraArgs: request.options?.extraArgs,
        });
      } else if (request.projectType === 'android') {
        buildCmd = generateAndroidBuildCommand({
          buildType: request.type as 'apk' | 'aab',
          releaseMode: request.options?.release_mode !== false,
          flavor: request.options?.flavor,
          extraArgs: request.options?.extraArgs,
        });
      } else {
        buildCmd = generateWebBuildCommand({
          releaseMode: request.options?.release_mode !== false,
          packageManager: request.options?.packageManager || 'npm',
          buildCommand: request.options?.buildCommand,
          extraArgs: request.options?.extraArgs,
        });
      }

      jobStatus.logs.push(`[Docker] Target image: ${buildCmd.image}`);
      jobStatus.logs.push(`[Docker] Command: ${buildCmd.command.join(' ')}`);

      // 3. Ensure image exists or pull
      try {
        await pullImageIfNeeded(buildCmd.image);
      } catch (pullErr: any) {
        jobStatus.logs.push(`[Docker] Pull warning: ${pullErr.message}. Attempting container execution...`);
      }

      // 4. Run the container
      const containerResult = await runContainer({
        image: buildCmd.image,
        command: buildCmd.command,
        workspaceHostPath: workspaceDir,
        workspaceContainerPath: '/workspace',
        envVars: buildCmd.envVars,
      });

      containerId = containerResult.containerId;
      jobStatus.logs.push(...containerResult.logs);

      if (containerResult.exitCode !== 0) {
        throw new Error(`Build failed with exit code ${containerResult.exitCode}`);
      }

      // 5. Inspect and extract artifacts
      jobStatus.logs.push('[Artifacts] Locating build outputs...');
      for (const artifactRelPath of buildCmd.artifactPaths) {
        const fullArtifactPath = path.join(workspaceDir, artifactRelPath);
        if (fs.existsSync(fullArtifactPath)) {
          const stats = fs.statSync(fullArtifactPath);
          const filename = path.basename(fullArtifactPath);
          const destArtifactPath = path.join(config.artifactBasePath, `${buildId}_${filename}`);

          fs.copyFileSync(fullArtifactPath, destArtifactPath);
          jobStatus.logs.push(`[Artifacts] Captured ${filename} (${stats.size} bytes)`);

          let downloadUrl = `/api/artifacts/${buildId}_${filename}`;
          // Try upload to S3 if configured
          try {
            const s3Key = `artifacts/${buildId}/${filename}`;
            await uploadArtifact(destArtifactPath, s3Key);
            downloadUrl = await getDownloadUrl(s3Key, 3600);
            jobStatus.logs.push(`[Storage] Uploaded to cloud storage: ${s3Key}`);
          } catch (s3Err: any) {
            jobStatus.logs.push(`[Storage] Local fallback storage used: ${s3Err.message}`);
          }

          jobStatus.artifacts.push({
            id: `${buildId}_${filename}`,
            filename,
            sizeBytes: stats.size,
            downloadUrl,
            path: destArtifactPath,
          });
        }
      }

      jobStatus.status = 'success';
      jobStatus.completedAt = new Date().toISOString();
      jobStatus.logs.push('[Build] Build completed successfully! ✅');
    } catch (err: any) {
      jobStatus.status = 'failed';
      jobStatus.errorMessage = err.message;
      jobStatus.completedAt = new Date().toISOString();
      jobStatus.logs.push(`[Error] Build failed: ${err.message} ❌`);
    } finally {
      // Cleanup container
      if (containerId) {
        await removeContainer(containerId).catch(() => {});
      }
    }

    return jobStatus;
  }
}

export const orchestrator = new BuildOrchestrator();
