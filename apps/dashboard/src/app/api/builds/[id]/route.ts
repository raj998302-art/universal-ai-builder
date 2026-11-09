import { NextRequest } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import { successResponse, notFoundResponse, parseBody } from '@/lib/api-utils';
import { query, isDatabaseAvailable } from '@/lib/db';
import { memoryStore } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const buildId = params.id;
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const rows = await query('SELECT * FROM build_jobs WHERE id = $1', [buildId]);
      if (rows && rows.length > 0) return successResponse(rows[0]);
    } catch (err: any) {
      console.error('DB error fetching build:', err);
    }
  }

  // Check orchestrator if available
  const orchestratorUrl = process.env.BUILD_WORKER_URL || 'http://localhost:3002';
  try {
    const res = await fetch(`${orchestratorUrl}/builds/${buildId}`, {
      headers: { Authorization: `Bearer ${process.env.API_SECRET || 'secret'}` },
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const liveStatus = await res.json();
      return successResponse(liveStatus);
    }
  } catch {}

  const job = memoryStore.buildJobs.get(buildId);
  if (!job) return notFoundResponse('Build job');

  return successResponse(job);
}

// Allow worker to update build status and artifacts
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const buildId = params.id;
  const body = await parseBody(request);
  if (!body) return notFoundResponse('Build job');

  const status = body.status as 'queued' | 'building' | 'success' | 'failed' | 'cancelled';
  const errorMessage = body.error_message ? String(body.error_message) : null;

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const res = await query(
        `UPDATE build_jobs 
         SET status = $1, error_message = $2, completed_at = CASE WHEN $1 IN ('success', 'failed', 'cancelled') THEN NOW() ELSE completed_at END 
         WHERE id = $3 
         RETURNING *`,
        [status, errorMessage, buildId]
      );
      if (res && res.length > 0) return successResponse(res[0]);
    } catch (err: any) {
      console.error('DB update error:', err);
    }
  }

  const job = memoryStore.buildJobs.get(buildId);
  if (!job) return notFoundResponse('Build job');

  job.status = status || job.status;
  if (errorMessage) job.error_message = errorMessage;
  if (['success', 'failed', 'cancelled'].includes(job.status)) {
    job.completed_at = new Date().toISOString();
  }

  return successResponse(job);
}
