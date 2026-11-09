import { NextResponse } from 'next/server';

export async function GET() {
  const openApiSpec = {
    openapi: '3.1.0',
    info: {
      title: 'Universal AI App & Website Builder API',
      version: '2.0.0',
      description:
        'REST and Actions Gateway for OpenAI ChatGPT and external AI agents. Create projects, generate full-stack websites, scaffold Flutter and Native Android code, trigger cloud builds (APK, AAB, Web), and download production artifacts.',
      contact: {
        name: 'Universal AI Builder Support',
        url: 'https://universal-ai-builder-nine.vercel.app',
      },
    },
    servers: [
      {
        url: 'https://universal-ai-builder-nine.vercel.app',
        description: 'Production Vercel Cloud Server',
      },
    ],
    security: [
      {
        BearerAuth: [],
      },
    ],
    paths: {
      '/api/mcp': {
        post: {
          summary: 'Execute MCP Tool via JSON-RPC 2.0',
          description:
            'Dispatches any of the 29 developer tools (e.g., generate_website, generate_application, build_flutter_apk, build_android_aab, build_website, get_build_status).',
          operationId: 'callMcpTool',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['jsonrpc', 'method', 'params'],
                  properties: {
                    jsonrpc: { type: 'string', example: '2.0' },
                    id: { type: 'string', example: 'chatgpt-action-1' },
                    method: { type: 'string', example: 'tools/call' },
                    params: {
                      type: 'object',
                      required: ['name', 'arguments'],
                      properties: {
                        name: { type: 'string', example: 'generate_website' },
                        arguments: {
                          type: 'object',
                          properties: {
                            prompt: { type: 'string', example: 'Modern SaaS e-commerce store with dark theme' },
                            name: { type: 'string', example: 'ApexStore' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Successful MCP JSON-RPC response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      jsonrpc: { type: 'string' },
                      id: { type: 'string' },
                      result: { type: 'object' },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized - Invalid or missing Bearer token',
            },
          },
        },
      },
      '/api/projects': {
        get: {
          summary: 'List All Projects',
          description: 'Returns all existing application and website projects.',
          operationId: 'listProjects',
          responses: {
            '200': {
              description: 'List of projects',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        type: { type: 'string', enum: ['flutter', 'android', 'web'] },
                        created_at: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create Project',
          description: 'Scaffolds a new Flutter, Native Android, or Web project.',
          operationId: 'createProject',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'type'],
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string', enum: ['flutter', 'android', 'web'] },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Project created successfully',
            },
          },
        },
      },
      '/api/builds': {
        post: {
          summary: 'Dispatch Cloud Build',
          description: 'Triggers a cloud build for Android APK, Android AAB, or Web distribution.',
          operationId: 'startBuild',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['project_id', 'build_type'],
                  properties: {
                    project_id: { type: 'string' },
                    build_type: { type: 'string', enum: ['apk', 'aab', 'web'] },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Build initiated successfully',
            },
          },
        },
      },
      '/api/preview/{id}': {
        get: {
          summary: 'Live Website Preview Sandbox',
          description: 'Renders the live interactive HTML/React preview of a website project.',
          operationId: 'getWebsitePreview',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'The unique Project ID',
            },
          ],
          responses: {
            '200': {
              description: 'Interactive HTML preview page',
              content: {
                'text/html': {
                  schema: { type: 'string' },
                },
              },
            },
            '404': {
              description: 'Project not found',
            },
          },
        },
      },
      '/api/health': {
        get: {
          summary: 'Health Check Endpoint',
          description: 'Reports operational status of control plane, storage, database, and capabilities.',
          operationId: 'getHealth',
          responses: {
            '200': {
              description: 'Health status response',
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT or API Key',
          description: 'Enter your Universal AI Builder API key (from /dashboard/api-keys).',
        },
      },
    },
  };

  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
