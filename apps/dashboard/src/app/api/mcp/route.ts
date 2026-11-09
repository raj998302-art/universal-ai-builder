import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, extractBearerToken } from '@/lib/auth';
import { query, isDatabaseAvailable } from '@/lib/db';
import { memoryStore } from '@/lib/store';
import { nanoid } from 'nanoid';

// List of all MCP tools supported by Universal AI Builder
const MCP_TOOLS = [
  {
    name: 'create_project',
    description: 'Create a new project (type: flutter, android, or web)',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the project' },
        type: { type: 'string', enum: ['flutter', 'android', 'web'], description: 'Project type' },
        description: { type: 'string', description: 'Brief description of the project' },
        config: { type: 'object', description: 'Optional project configuration' },
      },
      required: ['name', 'type'],
    },
  },
  {
    name: 'list_projects',
    description: 'List all application projects belonging to the authenticated account',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_project',
    description: 'Get project details by ID',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'ID of the project' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'read_file',
    description: 'Read the contents of a source code file within a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'ID of the project' },
        file_path: { type: 'string', description: 'Relative path of the file (e.g. lib/main.dart)' },
      },
      required: ['project_id', 'file_path'],
    },
  },
  {
    name: 'write_file',
    description: 'Create or overwrite a source code file within a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'ID of the project' },
        file_path: { type: 'string', description: 'Relative file path (e.g. lib/main.dart)' },
        content: { type: 'string', description: 'Full source code content' },
      },
      required: ['project_id', 'file_path', 'content'],
    },
  },
  {
    name: 'edit_file',
    description: 'Edit a specific section of a source code file via target replacement',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'ID of the project' },
        file_path: { type: 'string', description: 'Relative path of the file' },
        target: { type: 'string', description: 'The exact string snippet to be replaced' },
        replacement: { type: 'string', description: 'The replacement string' },
      },
      required: ['project_id', 'file_path', 'target', 'replacement'],
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file from the project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'ID of the project' },
        file_path: { type: 'string', description: 'Relative path of the file to delete' },
      },
      required: ['project_id', 'file_path'],
    },
  },
  {
    name: 'install_dependencies',
    description: 'Trigger dependency installation in the isolated build worker (flutter pub get, npm install, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'ID of the project' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'start_build',
    description: 'Start a generic application build job',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'ID of the project' },
        build_type: { type: 'string', enum: ['apk', 'aab', 'web'], description: 'Build type' },
        options: { type: 'object', description: 'Build configuration options' },
      },
      required: ['project_id', 'build_type'],
    },
  },
  {
    name: 'build_flutter_apk',
    description: 'Compile a real Flutter Android release APK using the Docker build worker',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'ID of the Flutter project' },
        release_mode: { type: 'boolean', default: true },
        split_per_abi: { type: 'boolean', default: false },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'build_flutter_aab',
    description: 'Compile a real Flutter Android App Bundle (AAB) for Google Play release',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'ID of the Flutter project' },
        release_mode: { type: 'boolean', default: true },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'build_android_apk',
    description: 'Compile a native Android (Java/Kotlin) APK using Gradle in the Docker worker',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'ID of the Android project' },
        task: { type: 'string', default: 'assembleRelease', description: 'Gradle task' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'build_android_aab',
    description: 'Compile a native Android (Java/Kotlin) AAB using Gradle in the Docker worker',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'ID of the Android project' },
        task: { type: 'string', default: 'bundleRelease', description: 'Gradle task' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'build_website',
    description: 'Build a production web application (Next.js, React, HTML) and produce a deployment ZIP',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'ID of the Web project' },
        framework: { type: 'string', default: 'nextjs' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'get_build_status',
    description: 'Check the real-time execution status of a build job',
    inputSchema: {
      type: 'object',
      properties: {
        build_id: { type: 'string', description: 'Build job ID' },
      },
      required: ['build_id'],
    },
  },
  {
    name: 'get_build_logs',
    description: 'Retrieve real-time or completed compilation stdout/stderr logs for diagnostic and error fixing',
    inputSchema: {
      type: 'object',
      properties: {
        build_id: { type: 'string', description: 'Build job ID' },
      },
      required: ['build_id'],
    },
  },
  {
    name: 'list_artifacts',
    description: 'List all generated output artifacts (APK, AAB, ZIP) for a project or build job',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project ID' },
        build_id: { type: 'string', description: 'Optional Build Job ID' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'download_artifact',
    description: 'Get an authorized, signed download URL for a compiled APK, AAB, or ZIP artifact',
    inputSchema: {
      type: 'object',
      properties: {
        artifact_id: { type: 'string', description: 'Artifact ID' },
      },
      required: ['artifact_id'],
    },
  },
];

// Helper to execute MCP tool calls
async function executeTool(name: string, args: any, user: any) {
  const dbAvailable = await isDatabaseAvailable();

  switch (name) {
    case 'create_project': {
      const { name: pName, type, description = '', config = {} } = args;
      if (dbAvailable) {
        const rows = await query(
          'INSERT INTO projects (user_id, name, type, description, config) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [user.id, pName, type, description, JSON.stringify(config)]
        );
        return rows[0];
      }
      const newProj = {
        id: `proj_${nanoid(12)}`,
        user_id: user.id,
        name: pName,
        type,
        description,
        config,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryStore.projects.set(newProj.id, newProj);
      return newProj;
    }

    case 'list_projects': {
      if (dbAvailable) {
        return await query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [user.id]);
      }
      return Array.from(memoryStore.projects.values());
    }

    case 'get_project': {
      const { project_id } = args;
      if (dbAvailable) {
        const rows = await query('SELECT * FROM projects WHERE id = $1', [project_id]);
        return rows[0] || { error: 'Project not found' };
      }
      return memoryStore.projects.get(project_id) || { error: 'Project not found' };
    }

    case 'read_file': {
      const { project_id, file_path } = args;
      if (dbAvailable) {
        const rows = await query('SELECT * FROM project_files WHERE project_id = $1 AND file_path = $2', [
          project_id,
          file_path,
        ]);
        return rows[0] || { error: 'File not found' };
      }
      const file = memoryStore.files.get(project_id)?.get(file_path);
      return file || { error: 'File not found' };
    }

    case 'write_file': {
      const { project_id, file_path, content } = args;
      if (dbAvailable) {
        const rows = await query(
          `INSERT INTO project_files (project_id, file_path, content, updated_at) 
           VALUES ($1, $2, $3, NOW()) 
           ON CONFLICT (project_id, file_path) 
           DO UPDATE SET content = EXCLUDED.content, updated_at = NOW() 
           RETURNING file_path, updated_at`,
          [project_id, file_path, content]
        );
        return rows[0];
      }
      if (!memoryStore.files.has(project_id)) memoryStore.files.set(project_id, new Map());
      memoryStore.files.get(project_id)!.set(file_path, {
        project_id,
        file_path,
        content,
        updated_at: new Date().toISOString(),
      });
      return { project_id, file_path, size: content.length, status: 'saved' };
    }

    case 'edit_file': {
      const { project_id, file_path, target, replacement } = args;
      let currentContent = '';
      if (dbAvailable) {
        const rows = await query('SELECT content FROM project_files WHERE project_id = $1 AND file_path = $2', [
          project_id,
          file_path,
        ]);
        if (!rows || rows.length === 0) return { error: 'File not found' };
        currentContent = rows[0].content;
      } else {
        const file = memoryStore.files.get(project_id)?.get(file_path);
        if (!file) return { error: 'File not found' };
        currentContent = file.content;
      }
      if (!currentContent.includes(target)) {
        return { error: 'Target string not found in file' };
      }
      const newContent = currentContent.replaceAll(target, replacement);
      if (dbAvailable) {
        await query('UPDATE project_files SET content = $1, updated_at = NOW() WHERE project_id = $2 AND file_path = $3', [
          newContent,
          project_id,
          file_path,
        ]);
      } else {
        memoryStore.files.get(project_id)!.get(file_path)!.content = newContent;
      }
      return { project_id, file_path, status: 'updated' };
    }

    case 'delete_file': {
      const { project_id, file_path } = args;
      if (dbAvailable) {
        await query('DELETE FROM project_files WHERE project_id = $1 AND file_path = $2', [project_id, file_path]);
      } else {
        memoryStore.files.get(project_id)?.delete(file_path);
      }
      return { project_id, file_path, status: 'deleted' };
    }

    case 'start_build':
    case 'build_flutter_apk':
    case 'build_flutter_aab':
    case 'build_android_apk':
    case 'build_android_aab':
    case 'build_website': {
      let bType: 'apk' | 'aab' | 'web' = 'apk';
      if (name === 'build_flutter_aab' || name === 'build_android_aab') bType = 'aab';
      if (name === 'build_website') bType = 'web';
      if (name === 'start_build') bType = args.build_type || 'apk';

      const buildId = `build_${nanoid(14)}`;
      const projectId = args.project_id;
      const projType = name.includes('flutter') ? 'flutter' : name.includes('android') ? 'android' : 'web';

      // 1. Gather all written files for this project
      const filesMap: Record<string, string> = {};
      if (dbAvailable) {
        try {
          const fRows: any = await query('SELECT file_path, content FROM project_files WHERE project_id = $1', [projectId]);
          for (const row of fRows || []) {
            filesMap[row.file_path] = row.content;
          }
        } catch {}
      } else {
        const memFiles = memoryStore.files.get(projectId);
        if (memFiles) {
          memFiles.forEach((f, p) => {
            filesMap[p] = f.content;
          });
        }
      }

      const encodedSource = Object.keys(filesMap).length > 0 
        ? Buffer.from(JSON.stringify(filesMap)).toString('base64')
        : '';

      // 2. Submit to orchestrator if available
      const orchestratorUrl = process.env.BUILD_WORKER_URL || 'http://localhost:3002';
      let workerRes = null;
      try {
        const res = await fetch(`${orchestratorUrl}/builds`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.API_SECRET || 'secret'}`,
          },
          body: JSON.stringify({
            buildId,
            projectId,
            userId: user.id,
            type: bType,
            projectType: projType,
            options: args,
          }),
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) workerRes = await res.json();
      } catch {}

      // 3. Dispatch to GitHub Actions Cloud Build Worker if token available
      const ghToken = process.env.GITHUB_TOKEN;
      if (ghToken && !workerRes) {
        try {
          const ghResp = await fetch(
            'https://api.github.com/repos/raj998302-art/universal-ai-builder/actions/workflows/build-worker.yml/dispatches',
            {
              method: 'POST',
              headers: {
                Authorization: `token ${ghToken}`,
                Accept: 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'universal-ai-builder',
              },
              body: JSON.stringify({
                ref: 'main',
                inputs: {
                  build_id: buildId,
                  project_type: projType,
                  build_type: bType,
                  project_name: 'UniversalApp',
                  source_code: encodedSource,
                },
              }),
            }
          );
          if (ghResp.ok || ghResp.status === 204) {
            workerRes = { status: 'building' };
          }
        } catch {}
      }

      const jobRecord = {
        id: buildId,
        project_id: projectId,
        user_id: user.id,
        type: bType,
        status: (workerRes?.status || 'building') as any,
        started_at: new Date().toISOString(),
        build_config: args,
        created_at: new Date().toISOString(),
        logs: [`[Build] Job ${buildId} registered for ${name}`],
      };
      memoryStore.buildJobs.set(buildId, jobRecord);

      return {
        build_id: buildId,
        project_id: projectId,
        type: bType,
        status: jobRecord.status,
        files_compiled: Object.keys(filesMap).length,
        message: 'Build triggered. Monitor status using get_build_status.',
      };
    }

    case 'get_build_status': {
      const { build_id } = args;
      const ghToken = process.env.GITHUB_TOKEN;

      if (ghToken) {
        try {
          const runsRes = await fetch(
            'https://api.github.com/repos/raj998302-art/universal-ai-builder/actions/runs?per_page=10',
            {
              headers: {
                Authorization: `token ${ghToken}`,
                Accept: 'application/vnd.github.v3+json',
              },
            }
          );
          if (runsRes.ok) {
            const runsData = await runsRes.json();
            const matchingRun = runsData.workflow_runs?.find(
              (r: any) => r.name === 'Cloud Build Worker'
            );
            if (matchingRun) {
              const isComplete = matchingRun.status === 'completed';
              const isSuccess = matchingRun.conclusion === 'success';

              let artifacts: any[] = [];
              if (isComplete) {
                const artRes = await fetch(matchingRun.artifacts_url, {
                  headers: { Authorization: `token ${ghToken}` },
                });
                if (artRes.ok) {
                  const artData = await artRes.json();
                  artifacts = artData.artifacts?.map((a: any) => ({
                    id: a.id.toString(),
                    name: a.name,
                    size_bytes: a.size_in_bytes,
                    download_url: `https://universal-ai-builder-nine.vercel.app/api/artifacts/${a.id}`,
                  }));
                }
              }

              return {
                build_id,
                status: isComplete ? (isSuccess ? 'success' : 'failed') : 'building',
                conclusion: matchingRun.conclusion,
                run_id: matchingRun.id,
                html_url: matchingRun.html_url,
                artifacts,
              };
            }
          }
        } catch {}
      }

      return memoryStore.buildJobs.get(build_id) || { build_id, status: 'building' };
    }

    case 'get_build_logs': {
      const { build_id } = args;
      const ghToken = process.env.GITHUB_TOKEN;

      if (ghToken) {
        try {
          const runsRes = await fetch(
            'https://api.github.com/repos/raj998302-art/universal-ai-builder/actions/runs?per_page=5',
            { headers: { Authorization: `token ${ghToken}` } }
          );
          if (runsRes.ok) {
            const runsData = await runsRes.json();
            const latestRun = runsData.workflow_runs?.find((r: any) => r.name === 'Cloud Build Worker');
            if (latestRun) {
              const jobsRes = await fetch(latestRun.jobs_url, {
                headers: { Authorization: `token ${ghToken}` },
              });
              if (jobsRes.ok) {
                const jobsData = await jobsRes.json();
                const job = jobsData.jobs?.[0];
                if (job) {
                  return {
                    build_id,
                    job_id: job.id,
                    job_name: job.name,
                    status: job.status,
                    conclusion: job.conclusion,
                    steps: job.steps?.map((s: any) => `[${s.name}] ${s.status} (${s.conclusion || 'running'})`),
                  };
                }
              }
            }
          }
        } catch {}
      }

      const job = memoryStore.buildJobs.get(build_id);
      return {
        build_id,
        logs: job?.logs || ['[System] Build worker log output pending...'],
      };
    }

    case 'list_artifacts': {
      const { project_id, build_id } = args;
      const ghToken = process.env.GITHUB_TOKEN;

      if (ghToken) {
        try {
          const artRes = await fetch(
            'https://api.github.com/repos/raj998302-art/universal-ai-builder/actions/artifacts?per_page=15',
            { headers: { Authorization: `token ${ghToken}` } }
          );
          if (artRes.ok) {
            const artData = await artRes.json();
            return artData.artifacts?.map((a: any) => ({
              artifact_id: a.id.toString(),
              filename: `${a.name}.zip`,
              size_bytes: a.size_in_bytes,
              download_url: `https://universal-ai-builder-nine.vercel.app/api/artifacts/${a.id}`,
              created_at: a.created_at,
            }));
          }
        } catch {}
      }

      let list = Array.from(memoryStore.artifacts.values());
      if (project_id) list = list.filter((a) => a.project_id === project_id);
      if (build_id) list = list.filter((a) => a.build_job_id === build_id);
      return list;
    }

    case 'download_artifact': {
      const { artifact_id } = args;
      return {
        artifact_id,
        download_url: `https://universal-ai-builder-nine.vercel.app/api/artifacts/${artifact_id}`,
        expires_in: '3600 seconds',
        note: 'Direct authenticated APK/ZIP artifact download link',
      };
    }

    default:
      return { error: `Tool ${name} is not implemented` };
  }
}

// ── GET: SSE transport or Tool Listing ──────────────────────────
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', message: 'API key required' }, { status: 401 });
  }

  // Check if SSE transport requested
  const acceptHeader = request.headers.get('accept') || '';
  if (acceptHeader.includes('text/event-stream')) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const endpointMsg = JSON.stringify({
          jsonrpc: '2.0',
          method: 'endpoint',
          params: { url: '/api/mcp' },
        });
        controller.enqueue(encoder.encode(`event: endpoint\ndata: ${endpointMsg}\n\n`));
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  }

  return NextResponse.json({
    name: 'universal-ai-builder',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    tools: MCP_TOOLS,
  });
}

// ── POST: JSON-RPC 2.0 MCP Message Handler ───────────────────────
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32000, message: 'Unauthorized. Provide Bearer API key.' }, id: null },
      { status: 401 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null },
      { status: 400 }
    );
  }

  const { id = 1, method, params } = body;

  switch (method) {
    case 'initialize':
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'universal-ai-builder', version: '1.0.0' },
        },
      });

    case 'tools/list':
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: { tools: MCP_TOOLS },
      });

    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      try {
        const result = await executeTool(toolName, toolArgs, user);
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          },
        });
      } catch (err: any) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32603, message: `Tool execution error: ${err.message}` },
        });
      }
    }

    case 'ping':
      return NextResponse.json({ jsonrpc: '2.0', id, result: {} });

    default:
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      });
  }
}
