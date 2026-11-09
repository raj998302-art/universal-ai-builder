/**
 * Universal AI Builder – MCP Server
 *
 * Exposes project, file, build, and status tools over HTTP+SSE
 * using the official @modelcontextprotocol/sdk.
 */

import express, { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { config } from './config';
import { authMiddleware, extractAuthContext } from './auth';
import { registerProjectTools } from './tools/project-tools';
import { registerFileTools } from './tools/file-tools';
import { registerBuildTools } from './tools/build-tools';
import { registerStatusTools } from './tools/status-tools';

// ── Create the MCP server ────────────────────────────────────────
const mcpServer = new McpServer({
  name: 'universal-ai-builder',
  version: '1.0.0',
});

// Register all tool groups
registerProjectTools(mcpServer);
registerFileTools(mcpServer);
registerBuildTools(mcpServer);
registerStatusTools(mcpServer);

// ── Express app for HTTP+SSE transport ───────────────────────────
const app = express();

// CORS
app.use((_req: Request, res: Response, next) => {
  const origin = _req.headers.origin || '*';
  const allowedOrigins = config.corsOrigins;
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (_req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

// Auth middleware (skips /health, /ready)
app.use(authMiddleware);

// Health checks
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'mcp-server', timestamp: new Date().toISOString() });
});

app.get('/ready', (_req: Request, res: Response) => {
  res.json({ ready: true });
});

// ── SSE transport map (one transport per client session) ─────────
const transports = new Map<string, SSEServerTransport>();

/**
 * GET /sse – opens an SSE stream for a client.
 * The client receives an `endpoint` event with the URL to POST messages to.
 */
app.get('/sse', async (req: Request, res: Response) => {
  console.log('[MCP] New SSE connection');

  const transport = new SSEServerTransport('/messages', res);
  const sessionId = transport.sessionId;
  transports.set(sessionId, transport);

  // Clean up on disconnect
  res.on('close', () => {
    console.log(`[MCP] SSE connection closed: ${sessionId}`);
    transports.delete(sessionId);
  });

  await mcpServer.connect(transport);
});

/**
 * POST /messages – receives JSON-RPC messages from the client for a session.
 */
app.post('/messages', async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) {
    res.status(400).json({ error: 'Missing sessionId query parameter' });
    return;
  }

  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).json({ error: 'Session not found. Connect via GET /sse first.' });
    return;
  }

  await transport.handlePostMessage(req, res);
});

// ── Start the server ─────────────────────────────────────────────
const PORT = config.port;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[MCP] Universal AI Builder MCP server listening on port ${PORT}`);
  console.log(`[MCP] API backend URL: ${config.apiUrl}`);
  console.log(`[MCP] SSE endpoint:    GET  http://0.0.0.0:${PORT}/sse`);
  console.log(`[MCP] Messages:        POST http://0.0.0.0:${PORT}/messages`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[MCP] SIGTERM received, shutting down...');
  for (const [id, transport] of transports) {
    transports.delete(id);
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[MCP] SIGINT received, shutting down...');
  process.exit(0);
});
