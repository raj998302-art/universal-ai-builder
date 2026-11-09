import { NextRequest, NextResponse } from 'next/server';
import { query, isDatabaseAvailable } from '@/lib/db';
import { memoryStore } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const artifactId = params.id;
  const ghToken = process.env.GITHUB_TOKEN;

  // 1. If artifactId is numeric (GitHub Actions artifact ID) or we have GITHUB_TOKEN
  if (ghToken && /^\d+$/.test(artifactId)) {
    try {
      const ghUrl = `https://api.github.com/repos/raj998302-art/universal-ai-builder/actions/artifacts/${artifactId}/zip`;
      const ghRes = await fetch(ghUrl, {
        headers: {
          Authorization: `token ${ghToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        redirect: 'manual',
      });

      // GitHub returns 302/303 redirect to signed cloud blob
      const redirectLocation = ghRes.headers.get('location');
      if (redirectLocation) {
        return NextResponse.redirect(redirectLocation, 307);
      }

      if (ghRes.ok) {
        const blob = await ghRes.blob();
        return new NextResponse(blob, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="artifact_${artifactId}.zip"`,
          },
        });
      }
    } catch (ghErr) {
      console.error('Error proxying GitHub artifact:', ghErr);
    }
  }

  // 2. Check local database or memory store
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

  if (artifact?.download_url?.startsWith('http')) {
    return NextResponse.redirect(artifact.download_url);
  }

  // 3. Fallback: check recent GitHub artifacts for matching filename/ID
  if (ghToken) {
    try {
      const listRes = await fetch(
        'https://api.github.com/repos/raj998302-art/universal-ai-builder/actions/artifacts?per_page=20',
        {
          headers: {
            Authorization: `token ${ghToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      if (listRes.ok) {
        const data = await listRes.json();
        const found = data.artifacts?.find(
          (a: any) => a.id.toString() === artifactId || a.name.includes(artifactId)
        );
        if (found) {
          const directRes = await fetch(
            `https://api.github.com/repos/raj998302-art/universal-ai-builder/actions/artifacts/${found.id}/zip`,
            {
              headers: {
                Authorization: `token ${ghToken}`,
              },
              redirect: 'manual',
            }
          );
          const loc = directRes.headers.get('location');
          if (loc) return NextResponse.redirect(loc, 307);
        }
      }
    } catch {}
  }

  return NextResponse.json({ error: 'Artifact not found or expired', artifact_id: artifactId }, { status: 404 });
}
