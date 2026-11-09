import { NextRequest, NextResponse } from 'next/server';
import { getProject, getFile, listProjectFiles } from '@/lib/storage-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  // 1. Try to find index.html or dist/index.html directly
  let indexFile = await getFile(projectId, 'index.html');
  if (!indexFile) indexFile = await getFile(projectId, 'dist/index.html');

  if (indexFile) {
    return new NextResponse(indexFile.content, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'ALLOWALL',
      },
    });
  }

  const project = await getProject(projectId);
  if (!project) {
    return new NextResponse(
      `<html><body style="background:#090d16;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
        <div style="text-align:center;"><h2>Project Not Found</h2><p style="color:#94a3b8;">ID: ${projectId}</p></div>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' }, status: 404 }
    );
  }

  // 2. If no index.html, list all project files in a preview inspector
  const files = await listProjectFiles(projectId);
  const fileListHtml = files.map(f => `<li style="padding:0.4rem 0;"><span style="color:#38bdf8;">${f.file_path}</span> (${f.content.length} bytes)</li>`).join('');

  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Preview: ${project.name}</title>
        <style>
          body { background: #090d16; color: #f8fafc; font-family: system-ui, sans-serif; padding: 2rem; }
          .container { max-width: 800px; margin: 0 auto; background: #161e31; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 2rem; }
          h1 { color: #38bdf8; margin-bottom: 0.5rem; }
          p { color: #94a3b8; margin-bottom: 1.5rem; }
          ul { background: #0f172a; padding: 1.5rem; border-radius: 8px; list-style: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${project.name}</h1>
          <p>Type: <b>${project.type}</b> · Description: ${project.description || 'No description'}</p>
          <h3>Project Files (${files.length})</h3>
          <ul>${fileListHtml || '<li style="color:#94a3b8;">No files generated yet</li>'}</ul>
        </div>
      </body>
    </html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
