import { NextRequest } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import { successResponse, errorResponse, parseBody } from '@/lib/api-utils';
import { query, isDatabaseAvailable } from '@/lib/db';
import { memoryStore } from '@/lib/store';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const body = await parseBody(request);
  if (!body || !body.project_id || !body.type) {
    return errorResponse('Missing required fields: project_id, type (apk | aab | web)', 400);
  }

  const projectId = String(body.project_id);
  const buildType = String(body.type).toLowerCase() as 'apk' | 'aab' | 'web';
  const options = (body.options as Record<string, unknown>) || {};

  if (!['apk', 'aab', 'web'].includes(buildType)) {
    return errorResponse('Invalid build type. Must be apk, aab, or web', 400);
  }

  const buildId = `build_${nanoid(14)}`;
  const dbAvailable = await isDatabaseAvailable();

  // Fetch project files to deliver to worker
  let projectFiles: Array<{ path: string; content: string }> = [];
  let projectType = 'web';

  if (dbAvailable) {
    try {
      const proj = (await query('SELECT type FROM projects WHERE id = $1', [projectId]))[0];
      if (proj) projectType = proj.type;

      const fRows = await query('SELECT file_path, content FROM project_files WHERE project_id = $1', [projectId]);
      projectFiles = fRows.map((r: any) => ({ path: r.file_path, content: r.content }));

      await query(
        `INSERT INTO build_jobs (id, project_id, user_id, type, status, build_config, started_at) 
         VALUES ($1, $2, $3, $4, 'queued', $5, NOW())`,
        [buildId, projectId, user.id, buildType, JSON.stringify(options)]
      );
    } catch (err: any) {
      console.error('Build DB error:', err);
    }
  } else {
    const proj = memoryStore.projects.get(projectId);
    if (proj) projectType = proj.type;
    const fMap = memoryStore.files.get(projectId);
    if (fMap) {
      projectFiles = Array.from(fMap.values()).map((f) => ({ path: f.file_path, content: f.content }));
    }

    memoryStore.buildJobs.set(buildId, {
      id: buildId,
      project_id: projectId,
      user_id: user.id,
      type: buildType,
      status: 'queued',
      started_at: new Date().toISOString(),
      build_config: options,
      created_at: new Date().toISOString(),
      logs: [`[System] Build job ${buildId} queued for project ${projectId} (${buildType})`],
    });
  }

  // 1. Forward to Build Orchestrator if running locally/privately
  const orchestratorUrl = process.env.BUILD_WORKER_URL || 'http://localhost:3002';
  try {
    const resp = await fetch(`${orchestratorUrl}/builds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_SECRET || 'secret'}`,
      },
      body: JSON.stringify({
        buildId,
        projectId,
        userId: user.id,
        type: buildType,
        projectType,
        files: projectFiles,
        options,
      }),
      signal: AbortSignal.timeout(3000),
    });

    if (resp.ok) {
      const workerData = await resp.json();
      return successResponse({
        buildId,
        projectId,
        type: buildType,
        status: workerData.status || 'building',
        message: 'Build successfully dispatched to Docker worker',
      }, 202);
    }
  } catch (workerErr: any) {
    // Orchestrator not directly connected, fall through to Cloud Build Worker
  }

  // 2. Dispatch to GitHub Actions Cloud Build Worker
  const ghToken = process.env.GITHUB_TOKEN;
  if (ghToken) {
    try {
      const ghResp = await fetch(
        'https://api.github.com/repos/raj998302-art/universal-ai-builder/actions/workflows/build-worker.yml/dispatches',
        {
          method: 'POST',
          headers: {
            Authorization: `token ${ghToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'universal-ai-builder',
          },
          body: JSON.stringify({
            ref: 'main',
            inputs: {
              build_id: buildId,
              project_type: projectType,
              build_type: buildType,
              project_name: 'UniversalApp',
            },
          }),
        }
      );

      if (ghResp.ok || ghResp.status === 204) {
        return successResponse({
          buildId,
          projectId,
          type: buildType,
          status: 'building',
          message: 'Build successfully dispatched to Cloud Build Worker runner',
        }, 202);
      }
    } catch (ghErr: any) {
      console.warn('GitHub dispatch error:', ghErr.message);
    }
  }

  return successResponse({
    buildId,
    projectId,
    type: buildType,
    status: 'queued',
    message: 'Build queued. Waiting for available build worker.',
  }, 202);
}
