import { createHash, randomBytes } from 'crypto';
import { query } from '@/lib/db';
import { NextRequest } from 'next/server';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Hash an API key using SHA-256.
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a new API key with a prefix for identification.
 */
export function generateApiKey(): string {
  const prefix = 'uab';
  const key = randomBytes(32).toString('hex');
  return `${prefix}_${key}`;
}

/**
 * Extract the Bearer token from the Authorization header.
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Authenticate a request using the API key from the Authorization header.
 * Returns the authenticated user or null if authentication fails.
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthUser | null> {
  const token = extractBearerToken(request);
  if (!token) {
    return null;
  }

  // Master API secret bypass (useful for orchestrator, MCP, and testing)
  const masterSecret = process.env.API_SECRET;
  if (masterSecret && token === masterSecret) {
    return {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'master@universal-ai-builder.dev',
      name: 'Master Admin',
    };
  }

  try {
    const keyHash = hashApiKey(token);

    const rows = await query(
      `SELECT u.id, u.email, u.name 
       FROM api_keys ak 
       JOIN users u ON ak.user_id = u.id 
       WHERE ak.key_hash = $1 
         AND (ak.expires_at IS NULL OR ak.expires_at > NOW())`,
      [keyHash]
    );

    if (rows && rows.length > 0) {
      // Update last_used_at asynchronously
      query(
        'UPDATE api_keys SET last_used_at = NOW() WHERE key_hash = $1',
        [keyHash]
      ).catch(() => {});

      return {
        id: rows[0].id,
        email: rows[0].email,
        name: rows[0].name,
      };
    }
  } catch (error) {
    // If DB is not available and token is a demo key, allow demo mode
    if (token.startsWith('uab_demo_') || token === 'demo-test-token') {
      return {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'demo@universal-ai-builder.dev',
        name: 'Demo Builder',
      };
    }
    console.error('Authentication error:', error);
  }

  return null;
}

/**
 * Create a JSON response for unauthorized requests.
 */
export function unauthorizedResponse() {
  return Response.json(
    {
      error: 'Unauthorized',
      message: 'Invalid or missing API key. Provide a valid Bearer token in the Authorization header.',
    },
    { status: 401 }
  );
}

/**
 * Log an audit event.
 */
export async function logAudit(
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null,
  ipAddress: string | null,
  details: Record<string, unknown> = {}
) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, resourceType, resourceId, ipAddress, JSON.stringify(details)]
    );
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Track usage event.
 */
export async function trackUsage(
  userId: string,
  action: string,
  resourceType: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    await query(
      `INSERT INTO usage_tracking (user_id, action, resource_type, metadata)
       VALUES ($1, $2, $3, $4)`,
      [userId, action, resourceType, JSON.stringify(metadata)]
    );
  } catch (error) {
    console.error('Failed to track usage:', error);
  }
}
