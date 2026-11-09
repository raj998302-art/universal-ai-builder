/**
 * MCP tools for project management operations.
 */

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { config } from '../config';
import { ApiResponse, Project, ProjectType } from '../types';

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
 * Register all project-related MCP tools on the server.
 */
export function registerProjectTools(server: McpServer): void {
  // ── create_project ──────────────────────────────────────────────
  server.tool(
    'create_project',
    'Create a new project with the given name, type, and description.',
    {
      name: z.string().min(1).max(100).describe('Project name'),
      type: z
        .enum(['flutter', 'android', 'web', 'react-native', 'next', 'vite'])
        .describe('Project type / framework'),
      description: z.string().max(500).optional().describe('Short project description'),
    },
    async ({ name, type, description }) => {
      const result = await apiRequest<Project>('POST', '/api/projects', {
        name,
        type,
        description: description || '',
      });

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: `Error creating project: ${result.error}` }],
          isError: true,
        };
      }

      const project = result.data!;
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                id: project.id,
                name: project.name,
                type: project.type,
                description: project.description,
                status: project.status,
                createdAt: project.createdAt,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ── list_projects ───────────────────────────────────────────────
  server.tool(
    'list_projects',
    'List all projects for the current user.',
    {},
    async () => {
      const result = await apiRequest<Project[]>('GET', '/api/projects');

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: `Error listing projects: ${result.error}` }],
          isError: true,
        };
      }

      const projects = result.data || [];
      if (projects.length === 0) {
        return {
          content: [{ type: 'text' as const, text: 'No projects found. Use create_project to create one.' }],
        };
      }

      const summary = projects.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        status: p.status,
        updatedAt: p.updatedAt,
      }));

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(summary, null, 2) }],
      };
    }
  );

  // ── get_project ─────────────────────────────────────────────────
  server.tool(
    'get_project',
    'Get full details of a project by its ID.',
    {
      project_id: z.string().min(1).describe('The project ID'),
    },
    async ({ project_id }) => {
      const result = await apiRequest<Project>('GET', `/api/projects/${encodeURIComponent(project_id)}`);

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: `Error getting project: ${result.error}` }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }],
      };
    }
  );
}
