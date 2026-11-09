import { NextRequest, NextResponse } from 'next/server';
import { generateApiKey, hashApiKey } from '@/lib/auth';
import { query, isDatabaseAvailable } from '@/lib/db';
import { successResponse, errorResponse, parseBody } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await parseBody(request);
    const name = (body?.name as string) || 'AI Agent Key';
    const email = (body?.email as string) || 'agent@universal-ai-builder.dev';

    const newKey = generateApiKey();
    const keyHash = hashApiKey(newKey);
    const dbAvailable = await isDatabaseAvailable();

    if (dbAvailable) {
      // Find or create user
      let user = (await query('SELECT id FROM users WHERE email = $1', [email]))[0];
      if (!user) {
        user = (
          await query(
            'INSERT INTO users (email, name, api_key_hash) VALUES ($1, $2, $3) RETURNING id',
            [email, name, keyHash]
          )
        )[0];
      }

      await query(
        'INSERT INTO api_keys (user_id, key_hash, name, permissions) VALUES ($1, $2, $3, $4)',
        [user.id, keyHash, name, JSON.stringify(['read', 'write', 'build'])]
      );

      return successResponse({
        apiKey: newKey,
        name,
        email,
        note: 'Save this API key immediately. It will not be shown again.',
      });
    }

    // Fallback when DB is not configured
    return successResponse({
      apiKey: newKey,
      name,
      email,
      note: 'Demo mode active: save this API key for Bearer authentication.',
    });
  } catch (err: any) {
    return errorResponse(`Failed to generate API key: ${err.message}`, 500);
  }
}
