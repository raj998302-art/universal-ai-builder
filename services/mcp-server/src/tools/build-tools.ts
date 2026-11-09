/**
 * MCP tools for build operations – trigger builds and manage build jobs.
 */

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { config } from '../config';
import { ApiResponse, BuildJob } from '../types';

/**
 * Make an authenticated request to the backend API.
 */
async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const url = `${config.apiUrl}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey) {
    headers['x-api-key'] = config.apiKey;
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || `HTTP ${res.status}: ${res.statusText}` };
    }
    return { success: true, data: data as T };
  } catch (err: any) {
    return { success: false, error: `API request failed: ${err.message}` };
  }
}

/** Common build options schema used by multiple tools */
const buildOptionsSchema = {
  releaseMode: z.boolean().optional().default(true).describe('Whether to build in release mode'),
  flavor: z.string().optional().describe('Build flavor / variant'),
  buildNumber: z.string().optional().describe('Build number (e.g. "42")'),
  buildName: z.string().optional().describe('Version name (e.g. "1.2.0")'),
  extraArgs: z.array(z.string()).optional().describe('Extra CLI arguments'),
};

/**
 * Register all build-related MCP tools on the server.
 */
export function registerBuildTools(server: McpServer): void {
  // ── install_dependencies ────────────────────────────────────────
  server.tool(
    'install_dependencies',
    'Install project dependencies (npm install, flutter pub get, etc.).',
    {
      project_id: z.string().min(1).describe('The project ID'),
    },
    async ({ project_id }) => {
      const result = await apiRequest<BuildJob>(
        'POST',
        `/api/projects/${encodeURIComponent(project_id)}/install`
      );

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: `Error installing dependencies: ${result.error}` }],
          isError: true,
        };
      }

      const job = result.data!;
      return {
        content: [
          {
            type: 'text' as const,
            text: `Dependency installation started.\nJob ID: ${job.id}\nStatus: ${job.status}\n\nUse get_build_status("${job.id}") to check progress.`,
          },
        ],
      };
    }
  );

  // ── start_build ─────────────────────────────────────────────────
  server.tool(
    'start_build',
    'Start a generic build for a project. The backend auto-detects the appropriate build type.',
    {
      project_id: z.string().min(1).describe('The project ID'),
      build_type: z
        .enum(['flutter-apk', 'flutter-aab', 'android-apk', 'android-aab', 'web', 'generic'])
        .describe('The type of build to run'),
      ...buildOptionsSchema,
    },
    async ({ project_id, build_type, releaseMode, flavor, buildNumber, buildName, extraArgs }) => {
      const result = await apiRequest<BuildJob>(
        'POST',
        `/api/projects/${encodeURIComponent(project_id)}/builds`,
        {
          buildType: build_type,
          options: {
            releaseMode,
            flavor,
            buildNumber,
            buildName,
            extraArgs,
          },
        }
      );

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: `Error starting build: ${result.error}` }],
          isError: true,
        };
      }

      const job = result.data!;
      return {
        content: [
          {
            type: 'text' as const,
            text: `Build started.\nJob ID: ${job.id}\nType: ${build_type}\nStatus: ${job.status}\n\nUse get_build_status("${job.id}") to monitor progress.`,
          },
        ],
      };
    }
  );

  // ── build_flutter_apk ──────────────────────────────────────────
  server.tool(
    'build_flutter_apk',
    'Build a Flutter project into an APK file.',
    {
      project_id: z.string().min(1).describe('The project ID'),
      target: z.string().optional().describe('Entry point file (default: lib/main.dart)'),
      ...buildOptionsSchema,
    },
    async ({ project_id, target, releaseMode, flavor, buildNumber, buildName, extraArgs }) => {
      const result = await apiRequest<BuildJob>(
        'POST',
        `/api/projects/${encodeURIComponent(project_id)}/builds`,
        {
          buildType: 'flutter-apk',
          options: { releaseMode, flavor, buildNumber, buildName, target, extraArgs },
        }
      );

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: `Error starting Flutter APK build: ${result.error}` }],
          isError: true,
        };
      }

      const job = result.data!;
      return {
        content: [
          {
            type: 'text' as const,
            text: `Flutter APK build started.\nJob ID: ${job.id}\nStatus: ${job.status}\n\nUse get_build_status("${job.id}") to monitor.`,
          },
        ],
      };
    }
  );

  // ── build_flutter_aab ──────────────────────────────────────────
  server.tool(
    'build_flutter_aab',
    'Build a Flutter project into an Android App Bundle (AAB).',
    {
      project_id: z.string().min(1).describe('The project ID'),
      target: z.string().optional().describe('Entry point file (default: lib/main.dart)'),
      ...buildOptionsSchema,
    },
    async ({ project_id, target, releaseMode, flavor, buildNumber, buildName, extraArgs }) => {
      const result = await apiRequest<BuildJob>(
        'POST',
        `/api/projects/${encodeURIComponent(project_id)}/builds`,
        {
          buildType: 'flutter-aab',
          options: { releaseMode, flavor, buildNumber, buildName, target, extraArgs },
        }
      );

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: `Error starting Flutter AAB build: ${result.error}` }],
          isError: true,
        };
      }

      const job = result.data!;
      return {
        content: [
          {
            type: 'text' as const,
            text: `Flutter AAB build started.\nJob ID: ${job.id}\nStatus: ${job.status}\n\nUse get_build_status("${job.id}") to monitor.`,
          },
        ],
      };
    }
  );

  // ── build_android_apk ──────────────────────────────────────────
  server.tool(
    'build_android_apk',
    'Build a native Android project into an APK using Gradle.',
    {
      project_id: z.string().min(1).describe('The project ID'),
      ...buildOptionsSchema,
    },
    async ({ project_id, releaseMode, flavor, buildNumber, buildName, extraArgs }) => {
      const result = await apiRequest<BuildJob>(
        'POST',
        `/api/projects/${encodeURIComponent(project_id)}/builds`,
        {
          buildType: 'android-apk',
          options: { releaseMode, flavor, buildNumber, buildName, extraArgs },
        }
      );

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: `Error starting Android APK build: ${result.error}` }],
          isError: true,
        };
      }

      const job = result.data!;
      return {
        content: [
          {
            type: 'text' as const,
            text: `Android APK build started.\nJob ID: ${job.id}\nStatus: ${job.status}\n\nUse get_build_status("${job.id}") to monitor.`,
          },
        ],
      };
    }
  );

  // ── build_android_aab ──────────────────────────────────────────
  server.tool(
    'build_android_aab',
    'Build a native Android project into an AAB using Gradle.',
    {
      project_id: z.string().min(1).describe('The project ID'),
      ...buildOptionsSchema,
    },
    async ({ project_id, releaseMode, flavor, buildNumber, buildName, extraArgs }) => {
      const result = await apiRequest<BuildJob>(
        'POST',
        `/api/projects/${encodeURIComponent(project_id)}/builds`,
        {
          buildType: 'android-aab',
          options: { releaseMode, flavor, buildNumber, buildName, extraArgs },
        }
      );

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: `Error starting Android AAB build: ${result.error}` }],
          isError: true,
        };
      }

      const job = result.data!;
      return {
        content: [
          {
            type: 'text' as const,
            text: `Android AAB build started.\nJob ID: ${job.id}\nStatus: ${job.status}\n\nUse get_build_status("${job.id}") to monitor.`,
          },
        ],
      };
    }
  );

  // ── build_website ──────────────────────────────────────────────
  server.tool(
    'build_website',
    'Build a web project (React, Next.js, Vite, etc.) into static or server output.',
    {
      project_id: z.string().min(1).describe('The project ID'),
      ...buildOptionsSchema,
    },
    async ({ project_id, releaseMode, extraArgs }) => {
      const result = await apiRequest<BuildJob>(
        'POST',
        `/api/projects/${encodeURIComponent(project_id)}/builds`,
        {
          buildType: 'web',
          options: { releaseMode, extraArgs },
        }
      );

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: `Error starting web build: ${result.error}` }],
          isError: true,
        };
      }

      const job = result.data!;
      return {
        content: [
          {
            type: 'text' as const,
            text: `Web build started.\nJob ID: ${job.id}\nStatus: ${job.status}\n\nUse get_build_status("${job.id}") to monitor.`,
          },
        ],
      };
    }
  );
}
