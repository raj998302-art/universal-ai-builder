/**
 * In-memory fallback repository when PostgreSQL database is not connected.
 * Ensures the dashboard and all API routes are functional out-of-the-box.
 */

export interface Project {
  id: string;
  user_id: string;
  name: string;
  type: 'flutter' | 'android' | 'web';
  description?: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  project_id: string;
  file_path: string;
  content: string;
  updated_at: string;
}

export interface BuildJob {
  id: string;
  project_id: string;
  user_id: string;
  type: 'apk' | 'aab' | 'web';
  status: 'queued' | 'building' | 'success' | 'failed' | 'cancelled';
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  build_config: Record<string, unknown>;
  created_at: string;
  logs?: string[];
}

export interface Artifact {
  id: string;
  build_job_id: string;
  project_id: string;
  type: 'apk' | 'aab' | 'zip' | 'log';
  filename: string;
  storage_path: string;
  size_bytes: number;
  checksum?: string;
  download_url?: string;
  expires_at?: string;
  created_at: string;
}

class MemoryStore {
  projects: Map<string, Project> = new Map();
  files: Map<string, Map<string, ProjectFile>> = new Map(); // projectId -> (filePath -> ProjectFile)
  buildJobs: Map<string, BuildJob> = new Map();
  artifacts: Map<string, Artifact> = new Map();

  constructor() {
    // Seed initial demo data
    const demoProjectId = 'proj_demo_flutter_001';
    this.projects.set(demoProjectId, {
      id: demoProjectId,
      user_id: '00000000-0000-0000-0000-000000000001',
      name: 'Sample Flutter App',
      type: 'flutter',
      description: 'Demo Flutter application ready to compile',
      config: { flutter_version: '3.24.5' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const projectFiles = new Map<string, ProjectFile>();
    projectFiles.set('pubspec.yaml', {
      project_id: demoProjectId,
      file_path: 'pubspec.yaml',
      content: `name: sample_flutter_app\ndescription: A sample Flutter application.\nversion: 1.0.0+1\nenvironment:\n  sdk: ">=3.0.0 <4.0.0"\ndependencies:\n  flutter:\n    sdk: flutter\n  cupertino_icons: ^1.0.6\n`,
      updated_at: new Date().toISOString(),
    });
    this.files.set(demoProjectId, projectFiles);
  }
}

// Global singleton across hot-reloads
const globalForStore = global as unknown as { uabStore?: MemoryStore };
export const memoryStore = globalForStore.uabStore || new MemoryStore();
if (process.env.NODE_ENV !== 'production') globalForStore.uabStore = memoryStore;
