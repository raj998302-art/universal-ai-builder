/**
 * Configuration for the build orchestrator service.
 */

export interface OrchestratorConfig {
  port: number;
  redisUrl: string;
  dockerSocket: string;
  workspaceBasePath: string;
  artifactBasePath: string;

  // S3-compatible storage
  s3Endpoint: string;
  s3Region: string;
  s3Bucket: string;
  s3AccessKey: string;
  s3SecretKey: string;
  s3ForcePathStyle: boolean;

  // Resource limits
  maxCpus: number;
  maxMemoryMb: number;
  maxDiskMb: number;
  buildTimeoutSeconds: number;

  // Docker images (from GHCR)
  images: {
    flutter: string;
    android: string;
    node: string;
  };
}

export function loadConfig(): OrchestratorConfig {
  return {
    port: parseInt(process.env.ORCHESTRATOR_PORT || '3002', 10),
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    dockerSocket: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
    workspaceBasePath: process.env.WORKSPACE_BASE_PATH || '/tmp/uab-workspaces',
    artifactBasePath: process.env.ARTIFACT_BASE_PATH || '/tmp/uab-artifacts',

    s3Endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    s3Region: process.env.S3_REGION || 'us-east-1',
    s3Bucket: process.env.S3_BUCKET || 'build-artifacts',
    s3AccessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    s3SecretKey: process.env.S3_SECRET_KEY || 'minioadmin',
    s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',

    maxCpus: parseFloat(process.env.MAX_CPUS || '2'),
    maxMemoryMb: parseInt(process.env.MAX_MEMORY_MB || '4096', 10),
    maxDiskMb: parseInt(process.env.MAX_DISK_MB || '10240', 10),
    buildTimeoutSeconds: parseInt(process.env.BUILD_TIMEOUT_SECONDS || '900', 10),

    images: {
      flutter: process.env.FLUTTER_IMAGE || 'ghcr.io/universalaibuilder/flutter-builder:latest',
      android: process.env.ANDROID_IMAGE || 'ghcr.io/universalaibuilder/android-builder:latest',
      node: process.env.NODE_IMAGE || 'node:20-alpine',
    },
  };
}

export const config = loadConfig();
