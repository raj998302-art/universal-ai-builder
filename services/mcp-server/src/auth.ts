/**
 * API key authentication middleware and helpers for the MCP server.
 */

import { Request, Response, NextFunction } from 'express';
import { config } from './config';
import { AuthContext } from './types';

const API_KEY_HEADER = 'x-api-key';
const AUTHORIZATION_HEADER = 'authorization';

/**
 * Extract auth context from an incoming request.
 * Supports both x-api-key header and Bearer token in Authorization header.
 */
export function extractAuthContext(req: Request): AuthContext | null {
  let apiKey = req.headers[API_KEY_HEADER] as string | undefined;

  if (!apiKey) {
    const authHeader = req.headers[AUTHORIZATION_HEADER] as string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.slice(7);
    }
  }

  if (!apiKey) {
    return null;
  }

  // In production, the API key would be validated against the backend
  // and the userId would be extracted from the key's associated account.
  // For now we derive a user id from the key itself.
  const userId = `user_${hashKey(apiKey).slice(0, 12)}`;

  return { userId, apiKey };
}

/**
 * Express middleware that enforces API key authentication.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip auth for health-check endpoints
  if (req.path === '/health' || req.path === '/ready') {
    next();
    return;
  }

  const ctx = extractAuthContext(req);

  if (!ctx) {
    res.status(401).json({ error: 'Missing API key. Provide x-api-key header or Bearer token.' });
    return;
  }

  // If the server was started with a fixed API_KEY, enforce it
  if (config.apiKey && ctx.apiKey !== config.apiKey) {
    res.status(403).json({ error: 'Invalid API key.' });
    return;
  }

  // Attach auth context to request for downstream use
  (req as any).authContext = ctx;
  next();
}

/**
 * Get auth headers to forward to the backend API.
 */
export function getBackendHeaders(authContext: AuthContext): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-key': authContext.apiKey,
    'x-user-id': authContext.userId,
  };
}

/**
 * Simple non-cryptographic hash for deriving user IDs from keys.
 */
function hashKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
