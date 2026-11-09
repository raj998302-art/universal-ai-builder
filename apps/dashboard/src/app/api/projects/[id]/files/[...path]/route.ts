import { NextRequest } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import { successResponse, errorResponse, notFoundResponse, parseBody } from '@/lib/api-utils';
import { query, isDatabaseAvailable } from '@/lib/db';
import { memoryStore } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; path: string[] } }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const projectId = params.id;
  const filePath = params.path.join('/');

  if (filePath.includes('..')) {
    return errorResponse('Invalid file path', 400);
  }

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const rows = await query(
        'SELECT * FROM project_files WHERE project_id = $1 AND file_path = $2',
        [projectId, filePath]
      );
      if (rows && rows.length > 0) return successResponse(rows[0]);
    } catch (err: any) {
      console.error('File read error:', err);
    }
  }

  const projectFiles = memoryStore.files.get(projectId);
  const file = projectFiles?.get(filePath);
  if (!file) return notFoundResponse('File');

  return successResponse(file);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; path: string[] } }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const projectId = params.id;
  const filePath = params.path.join('/');
  const body = await parseBody(request);

  if (filePath.includes('..')) return errorResponse('Invalid file path', 400);
  if (!body) return errorResponse('Invalid request body', 400);

  let newContent = '';
  // Support both full content replacement or target/replacement edit
  const dbAvailable = await isDatabaseAvailable();

  if (body.target !== undefined && body.replacement !== undefined) {
    // Perform snippet replacement
    let currentContent = '';
    if (dbAvailable) {
      const rows = await query(
        'SELECT content FROM project_files WHERE project_id = $1 AND file_path = $2',
        [projectId, filePath]
      );
      if (!rows || rows.length === 0) return notFoundResponse('File');
      currentContent = rows[0].content;
    } else {
      const f = memoryStore.files.get(projectId)?.get(filePath);
      if (!f) return notFoundResponse('File');
      currentContent = f.content;
    }

    const targetStr = String(body.target);
    const replacementStr = String(body.replacement);
    if (!currentContent.includes(targetStr)) {
      return errorResponse(`Target string not found in file: ${filePath}`, 400);
    }
    newContent = currentContent.replaceAll(targetStr, replacementStr);
  } else if (body.content !== undefined) {
    newContent = String(body.content);
  } else {
    return errorResponse('Either content or target/replacement must be supplied', 400);
  }

  if (dbAvailable) {
    try {
      const res = await query(
        `UPDATE project_files 
         SET content = $1, updated_at = NOW() 
         WHERE project_id = $2 AND file_path = $3 
         RETURNING file_path, updated_at, LENGTH(content) as size`,
        [newContent, projectId, filePath]
      );
      return successResponse(res[0]);
    } catch (err: any) {
      console.error('File edit error:', err);
    }
  }

  const projectFiles = memoryStore.files.get(projectId);
  if (!projectFiles || !projectFiles.has(filePath)) {
    return notFoundResponse('File');
  }

  projectFiles.set(filePath, {
    project_id: projectId,
    file_path: filePath,
    content: newContent,
    updated_at: new Date().toISOString(),
  });

  return successResponse({
    file_path: filePath,
    updated_at: new Date().toISOString(),
    size: newContent.length,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; path: string[] } }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const projectId = params.id;
  const filePath = params.path.join('/');

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      await query(
        'DELETE FROM project_files WHERE project_id = $1 AND file_path = $2',
        [projectId, filePath]
      );
      return successResponse({ deleted: true, file_path: filePath });
    } catch (err: any) {
      console.error('File delete error:', err);
    }
  }

  const projectFiles = memoryStore.files.get(projectId);
  if (projectFiles && projectFiles.has(filePath)) {
    projectFiles.delete(filePath);
    return successResponse({ deleted: true, file_path: filePath });
  }

  return notFoundResponse('File');
}
