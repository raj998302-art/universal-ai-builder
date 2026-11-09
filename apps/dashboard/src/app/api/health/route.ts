import { NextResponse } from 'next/server';
import { isDatabaseAvailable } from '@/lib/db';

export async function GET() {
  const dbConnected = await isDatabaseAvailable();
  const orchestratorUrl = process.env.BUILD_WORKER_URL || 'http://localhost:3002';
  
  let orchestratorStatus = 'unknown';
  try {
    const res = await fetch(`${orchestratorUrl}/health`, { signal: AbortSignal.timeout(2000) });
    orchestratorStatus = res.ok ? 'connected' : 'unhealthy';
  } catch {
    orchestratorStatus = 'disconnected';
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      control_plane: 'healthy',
      database: dbConnected ? 'connected' : 'disconnected (using in-memory fallback)',
      orchestrator: orchestratorStatus,
      storage: process.env.STORAGE_ENDPOINT ? 'configured' : 'local_fallback',
    },
    capabilities: [
      'flutter_apk',
      'flutter_aab',
      'android_apk',
      'android_aab',
      'web_build',
      'mcp_protocol',
    ],
  });
}
