/**
 * MCP tools for file operations within projects.
 */

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { config } from '../config';
import { ApiResponse, FileEntry } from '../types';

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
 * Validate that a file path is safe (no path traversal).
 */
function validateFilePath(filePath: string): string | null {
  const normalized = filePath.replace(/\\/g, '/');
  if (
    normalized.includes('..') ||
    normalized.startsWith('/') ||
    normalized.includes('\0') ||
    /[<>"|?*]/.test(normalized)
  ) {
    return 'Invalid file path: path traversal or illegal characters detected.';
  }
  return null;
}

/**
 * Register all file-related MCP tools on the server.
 */
export function registerFileTools(server: McpServer): void {
  // ── read_file ───────────────────────────────────────────────────
  server.tool(
    'read_file',
    'Read the contents of a file in a project.',
    {
      project_id: z.string().min(1).describe('The project ID'),
      file_path: z.string().min(1).describe('Relative file path within the project'),
    },
    async ({ project_id, file_path }) => {
      const pathError = validateFilePath(file_path);
      if (pathError) {
        return {
          content: [{ type: 'text' as const, text: pathError }],
          isError: true,
        };
      }

      const result = await apiRequest<{ content: string; encoding: string }>(
        'GET',
        `/api/projects/${encodeURIComponent(project_id)}/files/${encodeURIComponent(file_path)}`
      );

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: `Error reading file: ${result.error}` }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text' as const, text: result.data!.content }],
      };
    }
  );

  // ── write_file ──────────────────────────────────────────────────
  server.tool(
    'write_file',
    'Write or create a file in a project. Creates parent directories automatically.',
    {
      project_id: z.string().min(1).describe('The project ID'),
      file_path: z.string().min(1).describe('Relative file path within the project'),
      content: z.string().describe('Full file contents to write'),
    },
    async ({ project_id, file_path, content }) => {
      const pathError = validateFilePath(file_path);
      if (pathError) {
        return {
          content: [{ type: 'text' as const, text: pathError }],
          isError: true,
        };
      }

      const result = await apiRequest<{ path: string; size: number }>(
        'PUT',
        `/api/projects/${encodeURIComponent(project_id)}/files/${encodeURIComponent(file_path)}`,
        { content }
      );

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: `Error writing file: ${result.error}` }],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `File written successfully: ${result.data!.path} (${result.data!.size} bytes)`,
          },
        ],
      };
    }
  );

  // ── edit_file ───────────────────────────────────────────────────
  server.tool(
    'edit_file',
    'Edit a file by replacing a target string with a replacement string.',
    {
      project_id: z.string().min(1).describe('The project ID'),
      file_path: z.string().min(1).describe('Relative file path within the project'),
      target: z.string().min(1).describe('Exact string to find and replace'),
      replacement: z.string().describe('Replacement string'),
    },
    async ({ project_id, file_path, target, replacement }) => {
      const pathError = validateFilePath(file_path);
      if (pathError) {
        return {
          content: [{ type: 'text' as const, text: pathError }],
          isError: true,
        };
      }

      const result = await apiRequest<{ path: string; replacements: number }>(
        'PATCH',
        `/api/projects/${encodeURIComponent(project_id)}/files/${encodeURIComponent(file_path)}`,
        { target, replacement }
      );

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: `Error editing file: ${result.error}` }],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `File edited: ${result.data!.replacements} replacement(s) made in ${result.data!.path}`,
          },
        ],
      };
    }
  );

  // ── delete_file ─────────────────────────────────────────────────
  server.tool(
    'delete_file',
    'Delete a file from a project.',
    {
      project_id: z.string().min(1).describe('The project ID'),
      file_path: z.string().min(1).describe('Relative file path within the project'),
    },
    async ({ project_id, file_path }) => {
      const pathError = validateFilePath(file_path);
      if (pathError) {
        return {
          content: [{ type: 'text' as const, text: pathError }],
          isError: true,
        };
      }

      const result = await apiRequest<{ deleted: boolean }>(
        'DELETE',
        `/api/projects/${encodeURIComponent(project_id)}/files/${encodeURIComponent(file_path)}`
      );

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: `Error deleting file: ${result.error}` }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text' as const, text: `File deleted: ${file_path}` }],
      };
    }
  );
}
