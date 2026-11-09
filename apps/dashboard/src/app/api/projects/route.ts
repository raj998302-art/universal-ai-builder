import { NextRequest } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import { successResponse, errorResponse, parseBody } from '@/lib/api-utils';
import { query, isDatabaseAvailable } from '@/lib/db';
import { memoryStore } from '@/lib/store';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const rows = await query(
        'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
        [user.id]
      );
      return successResponse(rows);
    } catch (err: any) {
      console.error('Database query error:', err);
    }
  }

  // Memory fallback
  const userProjects = Array.from(memoryStore.projects.values()).filter(
    (p) => p.user_id === user.id || user.id.startsWith('00000000')
  );
  return successResponse(userProjects);
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const body = await parseBody(request);
  if (!body || !body.name || !body.type) {
    return errorResponse('Missing required fields: name, type (flutter | android | web)', 400);
  }

  const name = String(body.name).trim();
  const type = String(body.type).toLowerCase();
  const description = String(body.description || '');
  const config = (body.config as Record<string, unknown>) || {};

  if (!['flutter', 'android', 'web'].includes(type)) {
    return errorResponse('Invalid project type. Must be flutter, android, or web.', 400);
  }

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const result = await query(
        `INSERT INTO projects (user_id, name, type, description, config) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [user.id, name, type, description, JSON.stringify(config)]
      );
      return successResponse(result[0], 201);
    } catch (err: any) {
      console.error('Failed to create project in db:', err);
    }
  }

  // Fallback
  const newProject = {
    id: `proj_${nanoid(12)}`,
    user_id: user.id,
    name,
    type: type as 'flutter' | 'android' | 'web',
    description,
    config,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memoryStore.projects.set(newProject.id, newProject);
  return successResponse(newProject, 201);
}
