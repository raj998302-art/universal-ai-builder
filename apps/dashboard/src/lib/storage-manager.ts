import { query, isDatabaseAvailable } from './db';
import { memoryStore, Project, ProjectFile, BuildJob, Artifact } from './store';
export type { Project, ProjectFile, BuildJob, Artifact };

const GITHUB_REPO = 'raj998302-art/universal-ai-builder';

// Helper for GitHub repository persistent storage sync
async function gitGetFile(path: string): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.content && data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch {
    return null;
  }
}

async function gitSaveFile(path: string, content: string, message: string): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return false;
  try {
    const commitMsg = message.includes('[skip ci]') ? message : `${message} [skip ci]`;
    // Get existing file sha if it exists
    let sha: string | undefined;
    const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    }

    const body: any = {
      message: commitMsg,
      content: Buffer.from(content).toString('base64'),
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return putRes.ok;
  } catch {
    return false;
  }
}

async function gitDeleteFile(path: string, message: string): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return false;
  try {
    const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
      headers: { Authorization: `token ${token}` },
    });
    if (!getRes.ok) return false;
    const existing = await getRes.json();
    const delRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
      method: 'DELETE',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, sha: existing.sha }),
    });
    return delRes.ok;
  } catch {
    return false;
  }
}

// ── PROJECT OPERATIONS ──────────────────────────────────────────────
export async function getProject(id: string): Promise<Project | null> {
  // 1. Check local memory cache
  const cached = memoryStore.projects.get(id);
  if (cached) return cached;

  // 2. Check PostgreSQL database
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const rows: any = await query('SELECT * FROM projects WHERE id = $1', [id]);
      if (rows && rows.length > 0) {
        const p: Project = {
          id: rows[0].id,
          user_id: rows[0].user_id,
          name: rows[0].name,
          type: rows[0].type,
          description: rows[0].description,
          config: rows[0].config || {},
          created_at: rows[0].created_at,
          updated_at: rows[0].updated_at,
        };
        memoryStore.projects.set(id, p);
        return p;
      }
    } catch (e) {
      console.error('Database getProject error:', e);
    }
  }

  // 3. Fallback: check persistent GitHub storage & hydrate files
  const gitContent = await gitGetFile(`data/projects/${id}.json`);
  if (gitContent) {
    try {
      const data = JSON.parse(gitContent);
      const p: Project = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        type: data.type,
        description: data.description,
        config: data.config || {},
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      memoryStore.projects.set(id, p);

      if (data.files && typeof data.files === 'object') {
        if (!memoryStore.files.has(id)) {
          memoryStore.files.set(id, new Map());
        }
        for (const [filePath, content] of Object.entries(data.files)) {
          memoryStore.files.get(id)!.set(filePath, {
            project_id: id,
            file_path: filePath,
            content: content as string,
            updated_at: p.updated_at,
          });
        }
      }
      return p;
    } catch {}
  }

  return null;
}

export async function listProjects(userId?: string): Promise<Project[]> {
  const projectsMap = new Map<string, Project>();

  // 1. Gather from memory
  memoryStore.projects.forEach((p, id) => {
    if (!userId || p.user_id === userId) {
      projectsMap.set(id, p);
    }
  });

  // 2. Gather from PostgreSQL if connected
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const sql = userId ? 'SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC' : 'SELECT * FROM projects ORDER BY updated_at DESC';
      const params = userId ? [userId] : [];
      const rows: any = await query(sql, params);
      for (const row of rows || []) {
        projectsMap.set(row.id, {
          id: row.id,
          user_id: row.user_id,
          name: row.name,
          type: row.type,
          description: row.description,
          config: row.config || {},
          created_at: row.created_at,
          updated_at: row.updated_at,
        });
      }
    } catch {}
  }

  return Array.from(projectsMap.values());
}

export async function saveProject(project: Project, filesMap?: Record<string, string>): Promise<void> {
  // 1. Save to memory cache
  memoryStore.projects.set(project.id, project);

  if (filesMap) {
    if (!memoryStore.files.has(project.id)) {
      memoryStore.files.set(project.id, new Map());
    }
    for (const [p, c] of Object.entries(filesMap)) {
      memoryStore.files.get(project.id)!.set(p, {
        project_id: project.id,
        file_path: p,
        content: c,
        updated_at: new Date().toISOString(),
      });
    }
  }

  // 2. Save to database if connected
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      await query(
        `INSERT INTO projects (id, user_id, name, type, description, config, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           config = EXCLUDED.config,
           updated_at = NOW()`,
        [
          project.id,
          project.user_id,
          project.name,
          project.type,
          project.description || '',
          JSON.stringify(project.config || {}),
          project.created_at,
          project.updated_at,
        ]
      );
    } catch (e) {
      console.error('Database saveProject error:', e);
    }
  }

  // 3. Persist to GitHub storage (bundle project + all files in single atomic commit)
  const filesObj: Record<string, string> = {};
  const memFiles = memoryStore.files.get(project.id);
  if (memFiles) {
    memFiles.forEach((f, path) => {
      filesObj[path] = f.content;
    });
  }

  const payload = {
    ...project,
    files: filesObj,
  };

  try {
    await gitSaveFile(
      `data/projects/${project.id}.json`,
      JSON.stringify(payload, null, 2),
      `chore: sync project ${project.id} bundle [skip ci]`
    );
  } catch (err) {
    console.error('GitHub storage sync error:', err);
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  memoryStore.projects.delete(id);
  memoryStore.files.delete(id);

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      await query('DELETE FROM projects WHERE id = $1', [id]);
    } catch {}
  }

  gitDeleteFile(`data/projects/${id}.json`, `chore: delete project ${id}`).catch(() => {});
  return true;
}

// ── FILE OPERATIONS ─────────────────────────────────────────────────
export async function getFile(projectId: string, filePath: string): Promise<ProjectFile | null> {
  // 1. Check memory cache
  let cached = memoryStore.files.get(projectId)?.get(filePath);
  if (cached) return cached;

  // 2. Hydrate from persistent project bundle if available
  await getProject(projectId);
  cached = memoryStore.files.get(projectId)?.get(filePath);
  if (cached) return cached;

  // 3. Check Database
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const rows: any = await query('SELECT * FROM project_files WHERE project_id = $1 AND file_path = $2', [projectId, filePath]);
      if (rows && rows.length > 0) {
        const file: ProjectFile = {
          project_id: rows[0].project_id,
          file_path: rows[0].file_path,
          content: rows[0].content,
          updated_at: rows[0].updated_at,
        };
        if (!memoryStore.files.has(projectId)) memoryStore.files.set(projectId, new Map());
        memoryStore.files.get(projectId)!.set(filePath, file);
        return file;
      }
    } catch {}
  }

  // 3. Check GitHub storage
  const encodedPath = Buffer.from(filePath).toString('hex');
  const gitContent = await gitGetFile(`data/files/${projectId}/${encodedPath}.json`);
  if (gitContent) {
    try {
      const file = JSON.parse(gitContent) as ProjectFile;
      if (!memoryStore.files.has(projectId)) memoryStore.files.set(projectId, new Map());
      memoryStore.files.get(projectId)!.set(filePath, file);
      return file;
    } catch {}
  }

  return null;
}

export async function listProjectFiles(projectId: string): Promise<ProjectFile[]> {
  // Ensure project and files are hydrated from persistent storage
  await getProject(projectId);

  const filesMap = new Map<string, ProjectFile>();

  // 1. From memory
  const mem = memoryStore.files.get(projectId);
  if (mem) {
    mem.forEach((f, path) => filesMap.set(path, f));
  }

  // 2. From Database
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const rows: any = await query('SELECT file_path, content, updated_at FROM project_files WHERE project_id = $1', [projectId]);
      for (const row of rows || []) {
        filesMap.set(row.file_path, {
          project_id: projectId,
          file_path: row.file_path,
          content: row.content,
          updated_at: row.updated_at,
        });
      }
    } catch {}
  }

  return Array.from(filesMap.values());
}

export async function saveFile(projectId: string, filePath: string, content: string): Promise<ProjectFile> {
  const file: ProjectFile = {
    project_id: projectId,
    file_path: filePath,
    content,
    updated_at: new Date().toISOString(),
  };

  // 1. Memory cache
  if (!memoryStore.files.has(projectId)) {
    memoryStore.files.set(projectId, new Map());
  }
  memoryStore.files.get(projectId)!.set(filePath, file);

  // 2. Database
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      await query(
        `INSERT INTO project_files (project_id, file_path, content, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (project_id, file_path) DO UPDATE SET
           content = EXCLUDED.content,
           updated_at = NOW()`,
        [projectId, filePath, content]
      );
    } catch {}
  }

  // 3. GitHub storage (non-blocking background sync)
  const encodedPath = Buffer.from(filePath).toString('hex');
  gitSaveFile(
    `data/files/${projectId}/${encodedPath}.json`,
    JSON.stringify(file, null, 2),
    `chore: save file ${filePath} in ${projectId}`
  ).catch(() => {});

  return file;
}

export async function deleteFile(projectId: string, filePath: string): Promise<boolean> {
  memoryStore.files.get(projectId)?.delete(filePath);

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      await query('DELETE FROM project_files WHERE project_id = $1 AND file_path = $2', [projectId, filePath]);
    } catch {}
  }

  const encodedPath = Buffer.from(filePath).toString('hex');
  gitDeleteFile(`data/files/${projectId}/${encodedPath}.json`, `chore: delete file ${filePath}`).catch(() => {});
  return true;
}

// ── BUILD JOBS ──────────────────────────────────────────────────────
export async function saveBuildJob(job: BuildJob): Promise<void> {
  memoryStore.buildJobs.set(job.id, job);

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      await query(
        `INSERT INTO build_jobs (id, project_id, user_id, type, status, started_at, completed_at, error_message, build_config, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           completed_at = EXCLUDED.completed_at,
           error_message = EXCLUDED.error_message`,
        [
          job.id,
          job.project_id,
          job.user_id,
          job.type,
          job.status,
          job.started_at || null,
          job.completed_at || null,
          job.error_message || null,
          JSON.stringify(job.build_config || {}),
          job.created_at,
        ]
      );
    } catch {}
  }
}

export async function getBuildJob(id: string): Promise<BuildJob | null> {
  const cached = memoryStore.buildJobs.get(id);
  if (cached) return cached;

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const rows: any = await query('SELECT * FROM build_jobs WHERE id = $1', [id]);
      if (rows && rows.length > 0) return rows[0];
    } catch {}
  }
  return null;
}
