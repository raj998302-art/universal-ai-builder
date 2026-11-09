/**
 * Docker container lifecycle management.
 *
 * Handles pulling images, creating containers with resource limits,
 * mounting workspace volumes, streaming logs, and cleanup.
 */

import Docker from 'dockerode';
import { Writable, PassThrough } from 'stream';
import { config } from './config';
import { computeResourceLimits, ResourceLimits } from './security';

const docker = new Docker({ socketPath: config.dockerSocket });

export interface ContainerOptions {
  image: string;
  command: string[];
  workspaceHostPath: string;
  workspaceContainerPath: string;
  envVars?: Record<string, string>;
  resourceLimits?: Partial<ResourceLimits>;
  networkDisabled?: boolean;
}

export interface ContainerResult {
  exitCode: number;
  logs: string[];
  containerId: string;
}

/**
 * Pull a Docker image if it is not already cached locally.
 */
export async function pullImageIfNeeded(imageName: string): Promise<void> {
  try {
    const images = await docker.listImages({
      filters: { reference: [imageName] },
    });

    if (images.length > 0) {
      console.log(`[Docker] Image already available: ${imageName}`);
      return;
    }
  } catch {
    // If listing fails, try pulling anyway
  }

  console.log(`[Docker] Pulling image: ${imageName}`);

  return new Promise<void>((resolve, reject) => {
    docker.pull(imageName, {}, (err: Error | null, stream: NodeJS.ReadableStream) => {
      if (err) {
        reject(new Error(`Failed to pull image ${imageName}: ${err.message}`));
        return;
      }

      docker.modem.followProgress(
        stream,
        (followErr: Error | null) => {
          if (followErr) {
            reject(new Error(`Error pulling image ${imageName}: ${followErr.message}`));
          } else {
            console.log(`[Docker] Image pulled: ${imageName}`);
            resolve();
          }
        },
        (event: any) => {
          if (event.status) {
            console.log(`[Docker] ${event.status} ${event.progress || ''}`);
          }
        }
      );
    });
  });
}

/**
 * Create and run a Docker container with the given options.
 * Streams logs and enforces resource limits and timeout.
 */
export async function runContainer(opts: ContainerOptions): Promise<ContainerResult> {
  const limits = computeResourceLimits(opts.resourceLimits);
  const logLines: string[] = [];

  // Convert env vars to Docker format
  const env = Object.entries(opts.envVars || {}).map(([k, v]) => `${k}=${v}`);

  // Create the container
  const container = await docker.createContainer({
    Image: opts.image,
    Cmd: opts.command,
    Env: env,
    WorkingDir: opts.workspaceContainerPath,
    NetworkDisabled: opts.networkDisabled ?? false,
    HostConfig: {
      Binds: [`${opts.workspaceHostPath}:${opts.workspaceContainerPath}`],
      NanoCpus: Math.floor(limits.cpus * 1e9),
      Memory: limits.memoryBytes,
      MemorySwap: limits.memoryBytes, // No swap
      DiskQuota: limits.diskBytes,
      PidsLimit: 512,
      SecurityOpt: ['no-new-privileges'],
      ReadonlyRootfs: false,
      AutoRemove: false,
    },
  });

  const containerId = container.id;
  console.log(`[Docker] Container created: ${containerId.slice(0, 12)} (image: ${opts.image})`);

  // Attach to capture logs
  const logStream = new PassThrough();
  logStream.on('data', (chunk: Buffer) => {
    const lines = chunk.toString('utf-8').split('\n').filter(Boolean);
    for (const line of lines) {
      // Strip Docker stream header (8 bytes)
      const cleanLine = line.length > 8 ? line.slice(8) : line;
      logLines.push(cleanLine);
    }
  });

  // Start the container
  await container.start();
  console.log(`[Docker] Container started: ${containerId.slice(0, 12)}`);

  // Attach to log stream
  const stream = await container.logs({
    follow: true,
    stdout: true,
    stderr: true,
  });

  if (stream && typeof (stream as any).pipe === 'function') {
    (stream as any).pipe(logStream);
  }

  // Set up timeout
  const timeoutPromise = new Promise<'timeout'>((resolve) =>
    setTimeout(() => resolve('timeout'), limits.timeoutMs)
  );

  // Wait for completion or timeout
  const waitPromise = container.wait();

  const result = await Promise.race([waitPromise, timeoutPromise]);

  if (result === 'timeout') {
    console.log(`[Docker] Container timed out: ${containerId.slice(0, 12)}`);
    logLines.push(`\n[BUILD ERROR] Build timed out after ${limits.timeoutMs / 1000}s`);

    try {
      await container.kill();
    } catch {
      // Container may have already stopped
    }

    return { exitCode: 124, logs: logLines, containerId };
  }

  const exitCode = (result as any).StatusCode ?? 1;
  console.log(`[Docker] Container finished: ${containerId.slice(0, 12)} (exit: ${exitCode})`);

  return { exitCode, logs: logLines, containerId };
}

/**
 * Remove a container and its associated volumes.
 */
export async function removeContainer(containerId: string): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    try {
      await container.stop({ t: 5 });
    } catch {
      // Already stopped
    }
    await container.remove({ v: true, force: true });
    console.log(`[Docker] Container removed: ${containerId.slice(0, 12)}`);
  } catch (err: any) {
    console.error(`[Docker] Failed to remove container ${containerId.slice(0, 12)}: ${err.message}`);
  }
}

/**
 * List running containers created by this orchestrator.
 */
export async function listOrchestratorContainers(): Promise<Docker.ContainerInfo[]> {
  const containers = await docker.listContainers({
    all: true,
    filters: {
      label: ['managed-by=universal-ai-builder'],
    },
  });
  return containers;
}
