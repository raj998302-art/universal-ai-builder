import { NextRequest } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import { successResponse, errorResponse, notFoundResponse, parseBody } from '@/lib/api-utils';
import { query, isDatabaseAvailable } from '@/lib/db';
import { memoryStore } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const projectId = params.id;
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const rows = await query(
        'SELECT file_path, updated_at, LENGTH(content) as size FROM project_files WHERE project_id = $1 ORDER BY file_path ASC',
        [projectId]
      );
      return successResponse(rows);
    } catch (err: any) {
      console.error('File list error:', err);
    }
  }

  const projectFiles = memoryStore.files.get(projectId);
  if (!projectFiles) {
    return successResponse([]);
  }

  const list = Array.from(projectFiles.values()).map((f) => ({
    file_path: f.file_path,
    updated_at: f.updated_at,
    size: f.content.length,
  }));

  return successResponse(list);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const projectId = params.id;
  const body = await parseBody(request);
  if (!body || !body.file_path || body.content === undefined) {
    return errorResponse('Missing required fields: file_path, content', 400);
  }

  const filePath = String(body.file_path).trim().replace(/^\/+/, '');
  const content = String(body.content);

  // Prevent path traversal
  if (filePath.includes('..') || filePath.startsWith('/')) {
    return errorResponse('Invalid file_path: Path traversal characters are not permitted', 400);
  }

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const result = await query(
        `INSERT INTO project_files (project_id, file_path, content, updated_at) 
         VALUES ($1, $2, $3, NOW()) 
         ON CONFLICT (project_id, file_path) 
         DO UPDATE SET content = EXCLUDED.content, updated_at = NOW() 
         RETURNING file_path, updated_at, LENGTH(content) as size`,
        [projectId, filePath, content]
      );
      return successResponse(result[0], 201);
    } catch (err: any) {
      console.error('File write error:', err);
    }
  }

  if (!memoryStore.files.has(projectId)) {
    memoryStore.files.set(projectId, new Map());
  }

  const fileMap = memoryStore.files.get(projectId)!;
  fileMap.set(filePath, {
    project_id: projectId,
    file_path: filePath,
    content,
    updated_at: new Date().toISOString(),
  });

  return successResponse(
    {
      file_path: filePath,
      updated_at: new Date().toISOString(),
      size: content.length,
    },
    201
  );
}
