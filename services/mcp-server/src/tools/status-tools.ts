/**
 * MCP tools for build status, logs, and artifact management.
 */

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { config } from '../config';
import { ApiResponse, BuildJob, BuildArtifact } from '../types';

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

/**
 * Register all status & artifact MCP tools on the server.
 */
export function registerStatusTools(server: McpServer): void {
  // ── get_build_status ────────────────────────────────────────────
  server.tool(
    'get_build_status',
    'Get the current status of a build job.',
    {
      build_id: z.string().min(1).describe('The build job ID'),
    },
    async ({ build_id }) => {
      const result = await apiRequest<BuildJob>(
        'GET',
        `/api/builds/${encodeURIComponent(build_id)}`
      );

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: `Error getting build status: ${result.error}` }],
          isError: true,
        };
      }

      const job = result.data!;
      const info: Record<string, unknown> = {
        id: job.id,
        projectId: job.projectId,
        buildType: job.buildType,
        status: job.status,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      };

      if (job.error) {
        info.error = job.error;
      }

      if (job.artifacts && job.artifacts.length > 0) {
        info.artifacts = job.artifacts.map((a) => ({
          id: a.id,
          fileName: a.fileName,
          fileSize: a.fileSize,
        }));
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(info, null, 2) }],
      };
    }
  );

  // ── get_build_logs ──────────────────────────────────────────────
  server.tool(
    'get_build_logs',
    'Get the log output from a build job.',
    {
      build_id: z.string().min(1).describe('The build job ID'),
      tail: z
        .number()
        .int()
        .min(1)
        .max(1000)
        .optional()
        .default(100)
        .describe('Number of most recent log lines to return'),
    },
    async ({ build_id, tail }) => {
      const result = await apiRequest<{ logs: string[] }>(
        'GET',
        `/api/builds/${encodeURIComponent(build_id)}/logs?tail=${tail}`
      );

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: `Error getting build logs: ${result.error}` }],
          isError: true,
        };
      }

      const logs = result.data!.logs || [];
      if (logs.length === 0) {
        return {
          content: [{ type: 'text' as const, text: 'No logs available yet.' }],
        };
      }

      return {
        content: [{ type: 'text' as const, text: logs.join('\n') }],
      };
    }
  );

  // ── list_artifacts ──────────────────────────────────────────────
  server.tool(
    'list_artifacts',
    'List all build artifacts for a project.',
    {
      project_id: z.string().min(1).describe('The project ID'),
    },
    async ({ project_id }) => {
      const result = await apiRequest<BuildArtifact[]>(
        'GET',
        `/api/projects/${encodeURIComponent(project_id)}/artifacts`
      );

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: `Error listing artifacts: ${result.error}` }],
          isError: true,
        };
      }

      const artifacts = result.data || [];
      if (artifacts.length === 0) {
        return {
          content: [{ type: 'text' as const, text: 'No artifacts found for this project.' }],
        };
      }

      const summary = artifacts.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileSize: `${(a.fileSize / 1024 / 1024).toFixed(2)} MB`,
        createdAt: a.createdAt,
      }));

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(summary, null, 2) }],
      };
    }
  );

  // ── download_artifact ───────────────────────────────────────────
  server.tool(
    'download_artifact',
    'Get a signed download URL for a build artifact.',
    {
      artifact_id: z.string().min(1).describe('The artifact ID'),
    },
    async ({ artifact_id }) => {
      const result = await apiRequest<{ downloadUrl: string; expiresAt: string }>(
        'GET',
        `/api/artifacts/${encodeURIComponent(artifact_id)}/download`
      );

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: `Error getting download URL: ${result.error}` }],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `Download URL (expires ${result.data!.expiresAt}):\n${result.data!.downloadUrl}`,
          },
        ],
      };
    }
  );
}
