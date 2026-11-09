import { NextRequest } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import { successResponse, notFoundResponse, parseBody } from '@/lib/api-utils';
import { memoryStore } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const buildId = params.id;

  // Attempt orchestrator logs
  const orchestratorUrl = process.env.BUILD_WORKER_URL || 'http://localhost:3002';
  try {
    const res = await fetch(`${orchestratorUrl}/builds/${buildId}/logs`, {
      headers: { Authorization: `Bearer ${process.env.API_SECRET || 'secret'}` },
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const logs = await res.json();
      return successResponse(logs);
    }
  } catch {}

  const job = memoryStore.buildJobs.get(buildId);
  if (!job) return notFoundResponse('Build job');

  return successResponse({
    buildId,
    status: job.status,
    logs: job.logs || [
      `[System] Initializing build ${buildId}...`,
      `[Docker] Environment: ${job.type}`,
      `[Status] Current state: ${job.status}`,
    ],
  });
}

// Allow worker to append logs
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const buildId = params.id;
  const body = await parseBody(request);
  const logLine = body?.line ? String(body.line) : '';

  const job = memoryStore.buildJobs.get(buildId);
  if (job && logLine) {
    if (!job.logs) job.logs = [];
    job.logs.push(logLine);
  }

  return successResponse({ received: true });
}
