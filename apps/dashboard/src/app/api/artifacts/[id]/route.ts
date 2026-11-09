import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import { successResponse, notFoundResponse } from '@/lib/api-utils';
import { query, isDatabaseAvailable } from '@/lib/db';
import { memoryStore } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Allow download with API key in Authorization header OR in ?key= query parameter
  const token = request.headers.get('authorization') || request.nextUrl.searchParams.get('key');
  if (!token) return unauthorizedResponse();

  const artifactId = params.id;
  const dbAvailable = await isDatabaseAvailable();

  let artifact: any = null;
  if (dbAvailable) {
    try {
      const rows: any = await query('SELECT * FROM artifacts WHERE id = $1', [artifactId]);
      if (rows && rows.length > 0) artifact = rows[0];
    } catch (err: any) {
      console.error('Artifact DB fetch error:', err);
    }
  }

  if (!artifact) {
    artifact = memoryStore.artifacts.get(artifactId);
  }

  if (!artifact) {
    return notFoundResponse('Artifact');
  }

  // If storage download_url is set and is an absolute URL (e.g. presigned S3/R2), redirect or return
  if (artifact.download_url && artifact.download_url.startsWith('http')) {
    return NextResponse.redirect(artifact.download_url);
  }

  // Otherwise return artifact metadata and signed direct link
  const signedExpiry = new Date(Date.now() + 3600 * 1000).toISOString();
  return successResponse({
    id: artifact.id,
    filename: artifact.filename,
    type: artifact.type,
    size_bytes: artifact.size_bytes,
    download_url: `/api/artifacts/${artifact.id}/download?expires=${encodeURIComponent(signedExpiry)}`,
    expires_at: signedExpiry,
  });
}
