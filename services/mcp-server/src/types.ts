/**
 * Type definitions for the MCP server
 */

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  description: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  userId: string;
  settings: ProjectSettings;
}

export type ProjectType = 'flutter' | 'android' | 'web' | 'react-native' | 'next' | 'vite';

export type ProjectStatus = 'active' | 'archived' | 'building' | 'error';

export interface ProjectSettings {
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun';
  buildCommand?: string;
  outputDir?: string;
  flutterVersion?: string;
  androidSdkVersion?: string;
  javaVersion?: string;
}

export interface FileEntry {
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: string;
}

export interface BuildJob {
  id: string;
  projectId: string;
  buildType: BuildType;
  status: BuildStatus;
  logs: string[];
  artifacts: BuildArtifact[];
  startedAt?: string;
  completedAt?: string;
  error?: string;
  options: BuildOptions;
}

export type BuildType =
  | 'flutter-apk'
  | 'flutter-aab'
  | 'android-apk'
  | 'android-aab'
  | 'web'
  | 'generic';

export type BuildStatus = 'queued' | 'running' | 'success' | 'failed' | 'cancelled';

export interface BuildOptions {
  releaseMode?: boolean;
  flavor?: string;
  target?: string;
  buildNumber?: string;
  buildName?: string;
  extraArgs?: string[];
  envVars?: Record<string, string>;
}

export interface BuildArtifact {
  id: string;
  buildId: string;
  projectId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl?: string;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthContext {
  userId: string;
  apiKey: string;
}

export interface ToolResult {
  content: ToolContent[];
  isError?: boolean;
}

export interface ToolContent {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
}

export interface ServerConfig {
  port: number;
  apiUrl: string;
  apiKey: string;
  corsOrigins: string[];
  logLevel: string;
}
