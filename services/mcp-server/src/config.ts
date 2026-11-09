/**
 * Configuration management for the MCP server.
 * Reads from environment variables with sensible defaults.
 */

import { ServerConfig } from './types';

export function loadConfig(): ServerConfig {
  return {
    port: parseInt(process.env.MCP_PORT || '3001', 10),
    apiUrl: process.env.API_URL || 'http://localhost:3000',
    apiKey: process.env.API_KEY || '',
    corsOrigins: (process.env.CORS_ORIGINS || '*').split(',').map((s) => s.trim()),
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}

export const config = loadConfig();
