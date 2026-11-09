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
      const rows = await query('SELECT * FROM projects WHERE id = $1', [projectId]);
      if (rows && rows.length > 0) return successResponse(rows[0]);
    } catch (err: any) {
      console.error('Database error:', err);
    }
  }

  const project = memoryStore.projects.get(projectId);
  if (!project) return notFoundResponse('Project');
  return successResponse(project);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const projectId = params.id;
  const body = await parseBody(request);
  if (!body) return errorResponse('Invalid request body', 400);

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const existing = (await query('SELECT * FROM projects WHERE id = $1', [projectId]))[0];
      if (!existing) return notFoundResponse('Project');

      const name = body.name ? String(body.name) : existing.name;
      const description = body.description !== undefined ? String(body.description) : existing.description;
      const config = body.config ? JSON.stringify(body.config) : JSON.stringify(existing.config);

      const updated = await query(
        `UPDATE projects 
         SET name = $1, description = $2, config = $3, updated_at = NOW() 
         WHERE id = $4 
         RETURNING *`,
        [name, description, config, projectId]
      );
      return successResponse(updated[0]);
    } catch (err: any) {
      console.error('Update error:', err);
    }
  }

  const existing = memoryStore.projects.get(projectId);
  if (!existing) return notFoundResponse('Project');

  const updated = {
    ...existing,
    name: body.name ? String(body.name) : existing.name,
    description: body.description !== undefined ? String(body.description) : existing.description,
    config: (body.config as Record<string, unknown>) || existing.config,
    updated_at: new Date().toISOString(),
  };

  memoryStore.projects.set(projectId, updated);
  return successResponse(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const projectId = params.id;
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      await query('DELETE FROM projects WHERE id = $1', [projectId]);
      return successResponse({ deleted: true, projectId });
    } catch (err: any) {
      console.error('Delete error:', err);
    }
  }

  if (memoryStore.projects.has(projectId)) {
    memoryStore.projects.delete(projectId);
    memoryStore.files.delete(projectId);
    return successResponse({ deleted: true, projectId });
  }

  return notFoundResponse('Project');
}
