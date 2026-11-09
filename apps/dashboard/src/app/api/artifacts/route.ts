import { NextRequest } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import { successResponse, errorResponse, parseBody } from '@/lib/api-utils';
import { query, isDatabaseAvailable } from '@/lib/db';
import { memoryStore } from '@/lib/store';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('project_id');
  const buildJobId = searchParams.get('build_job_id');

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      let sql = 'SELECT * FROM artifacts WHERE 1=1';
      const params: any[] = [];
      if (projectId) {
        params.push(projectId);
        sql += ` AND project_id = $${params.length}`;
      }
      if (buildJobId) {
        params.push(buildJobId);
        sql += ` AND build_job_id = $${params.length}`;
      }
      sql += ' ORDER BY created_at DESC';

      const rows = await query(sql, params);
      return successResponse(rows);
    } catch (err: any) {
      console.error('Artifacts DB error:', err);
    }
  }

  let list = Array.from(memoryStore.artifacts.values());
  if (projectId) list = list.filter((a) => a.project_id === projectId);
  if (buildJobId) list = list.filter((a) => a.build_job_id === buildJobId);

  return successResponse(list);
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const body = await parseBody(request);
  if (!body || !body.build_job_id || !body.filename || !body.type) {
    return errorResponse('Missing required fields: build_job_id, filename, type', 400);
  }

  const id = `art_${nanoid(12)}`;
  const artifact = {
    id,
    build_job_id: String(body.build_job_id),
    project_id: String(body.project_id || ''),
    type: body.type as 'apk' | 'aab' | 'zip' | 'log',
    filename: String(body.filename),
    storage_path: String(body.storage_path || ''),
    size_bytes: Number(body.size_bytes || 0),
    checksum: body.checksum ? String(body.checksum) : undefined,
    download_url: body.download_url ? String(body.download_url) : `/api/artifacts/${id}`,
    expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
    created_at: new Date().toISOString(),
  };

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const res = await query(
        `INSERT INTO artifacts (id, build_job_id, project_id, type, filename, storage_path, size_bytes, checksum, download_url, expires_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         RETURNING *`,
        [
          artifact.id,
          artifact.build_job_id,
          artifact.project_id,
          artifact.type,
          artifact.filename,
          artifact.storage_path,
          artifact.size_bytes,
          artifact.checksum,
          artifact.download_url,
          artifact.expires_at,
        ]
      );
      return successResponse(res[0], 201);
    } catch (err: any) {
      console.error('Artifact insert error:', err);
    }
  }

  memoryStore.artifacts.set(artifact.id, artifact);
  return successResponse(artifact, 201);
}
