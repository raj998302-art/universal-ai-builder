/**
 * S3-compatible storage client for build artifacts.
 *
 * Handles uploading artifacts, generating signed download URLs,
 * listing artifacts, and deleting them.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { config } from './config';

const s3 = new S3Client({
  endpoint: config.s3Endpoint,
  region: config.s3Region,
  credentials: {
    accessKeyId: config.s3AccessKey,
    secretAccessKey: config.s3SecretKey,
  },
  forcePathStyle: config.s3ForcePathStyle,
});

/**
 * Ensure the artifact bucket exists, creating it if necessary.
 */
export async function ensureBucket(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: config.s3Bucket }));
  } catch (err: any) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      console.log(`[Storage] Creating bucket: ${config.s3Bucket}`);
      await s3.send(new CreateBucketCommand({ Bucket: config.s3Bucket }));
    } else {
      throw err;
    }
  }
}

/**
 * Upload a local file to S3 as a build artifact.
 *
 * @param localPath  Absolute path to the file on disk.
 * @param s3Key      S3 object key (e.g. "project123/build456/app.apk").
 * @param mimeType   MIME type for the object.
 * @returns          The S3 key of the uploaded object.
 */
export async function uploadArtifact(
  localPath: string,
  s3Key: string,
  mimeType: string = 'application/octet-stream'
): Promise<{ key: string; size: number }> {
  const fileStream = fs.createReadStream(localPath);
  const stats = fs.statSync(localPath);

  await s3.send(
    new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: s3Key,
      Body: fileStream,
      ContentType: mimeType,
      ContentLength: stats.size,
      Metadata: {
        'uploaded-by': 'universal-ai-builder',
        'uploaded-at': new Date().toISOString(),
      },
    })
  );

  console.log(`[Storage] Uploaded: ${s3Key} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

  return { key: s3Key, size: stats.size };
}

/**
 * Generate a pre-signed download URL for an artifact.
 *
 * @param s3Key      The S3 object key.
 * @param expiresIn  URL validity in seconds (default: 1 hour).
 * @returns          The signed URL and its expiry timestamp.
 */
export async function getDownloadUrl(
  s3Key: string,
  expiresIn: number = 3600
): Promise<{ url: string; expiresAt: string }> {
  const command = new GetObjectCommand({
    Bucket: config.s3Bucket,
    Key: s3Key,
  });

  const url = await getSignedUrl(s3, command, { expiresIn });
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return { url, expiresAt };
}

/**
 * List all artifacts for a given project (by S3 prefix).
 */
export async function listArtifacts(
  projectId: string
): Promise<Array<{ key: string; size: number; lastModified: string }>> {
  const prefix = `${projectId}/`;

  const response = await s3.send(
    new ListObjectsV2Command({
      Bucket: config.s3Bucket,
      Prefix: prefix,
    })
  );

  const items = (response.Contents || []).map((obj) => ({
    key: obj.Key || '',
    size: obj.Size || 0,
    lastModified: obj.LastModified?.toISOString() || '',
  }));

  return items;
}

/**
 * Delete an artifact from S3.
 */
export async function deleteArtifact(s3Key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: config.s3Bucket,
      Key: s3Key,
    })
  );

  console.log(`[Storage] Deleted: ${s3Key}`);
}

/**
 * Determine the MIME type for a build artifact by its file extension.
 */
export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.apk': 'application/vnd.android.package-archive',
    '.aab': 'application/x-authorware-bin',
    '.zip': 'application/zip',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    '.tgz': 'application/gzip',
    '.js': 'application/javascript',
    '.html': 'text/html',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ipa': 'application/octet-stream',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}
