/**
 * Security utilities – input validation, path traversal prevention,
 * command injection prevention, and resource limit enforcement.
 */

import path from 'path';
import { config } from './config';

// ── Path Safety ──────────────────────────────────────────────────

/**
 * Validate that a path is safe and contained within the allowed base directory.
 * Throws if the path attempts traversal or contains illegal characters.
 */
export function validateSafePath(userPath: string, baseDir: string): string {
  // Reject null bytes
  if (userPath.includes('\0')) {
    throw new SecurityError('Path contains null byte');
  }

  // Normalise and resolve
  const normalized = path.normalize(userPath).replace(/\\/g, '/');

  // Reject obvious traversal patterns
  if (normalized.includes('..')) {
    throw new SecurityError('Path traversal detected: ".." is not allowed');
  }

  // Resolve the full path
  const resolved = path.resolve(baseDir, normalized);

  // Ensure it is still under the base directory
  if (!resolved.startsWith(path.resolve(baseDir))) {
    throw new SecurityError(`Path escapes workspace: ${resolved}`);
  }

  // Reject shell-dangerous characters
  if (/[|;&$`!<>{}()\[\]*?~#]/.test(userPath)) {
    throw new SecurityError('Path contains disallowed shell characters');
  }

  return resolved;
}

// ── Command Injection Prevention ─────────────────────────────────

/**
 * Sanitise a value so it is safe to embed in a shell command.
 * Only allows alphanumeric, dots, hyphens, underscores, slashes, colons, and equals.
 */
export function sanitizeShellArg(arg: string): string {
  if (/[^a-zA-Z0-9._\-/:=@]/.test(arg)) {
    throw new SecurityError(`Argument contains disallowed characters: ${arg}`);
  }
  return arg;
}

/**
 * Validate a list of extra CLI arguments for safety.
 */
export function validateExtraArgs(args: string[]): string[] {
  return args.map((arg) => {
    // Each argument must be a flag or a key=value pair
    if (/^--?[a-zA-Z0-9][a-zA-Z0-9._-]*(=\S+)?$/.test(arg)) {
      return arg;
    }
    throw new SecurityError(`Invalid CLI argument: ${arg}`);
  });
}

// ── Resource Limit Enforcement ───────────────────────────────────

export interface ResourceLimits {
  cpus: number;
  memoryBytes: number;
  diskBytes: number;
  timeoutMs: number;
}

/**
 * Compute resource limits for a build job, capped by global maximums.
 */
export function computeResourceLimits(requested?: Partial<ResourceLimits>): ResourceLimits {
  const maxCpus = config.maxCpus;
  const maxMemBytes = config.maxMemoryMb * 1024 * 1024;
  const maxDiskBytes = config.maxDiskMb * 1024 * 1024;
  const maxTimeoutMs = config.buildTimeoutSeconds * 1000;

  return {
    cpus: Math.min(requested?.cpus ?? maxCpus, maxCpus),
    memoryBytes: Math.min(requested?.memoryBytes ?? maxMemBytes, maxMemBytes),
    diskBytes: Math.min(requested?.diskBytes ?? maxDiskBytes, maxDiskBytes),
    timeoutMs: Math.min(requested?.timeoutMs ?? maxTimeoutMs, maxTimeoutMs),
  };
}

// ── Input Validation ─────────────────────────────────────────────

/**
 * Validate a project ID format (alphanumeric + hyphens + underscores).
 */
export function validateProjectId(id: string): string {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) {
    throw new SecurityError(`Invalid project ID format: ${id}`);
  }
  return id;
}

/**
 * Validate a build ID format.
 */
export function validateBuildId(id: string): string {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) {
    throw new SecurityError(`Invalid build ID format: ${id}`);
  }
  return id;
}

/**
 * Validate environment variable names and values.
 */
export function validateEnvVars(envVars: Record<string, string>): Record<string, string> {
  const validated: Record<string, string> = {};
  for (const [key, value] of Object.entries(envVars)) {
    // Key must be a valid env var name
    if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
      throw new SecurityError(`Invalid environment variable name: ${key}`);
    }
    // Value must not contain control characters except newline
    if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value)) {
      throw new SecurityError(`Environment variable value contains control characters: ${key}`);
    }
    validated[key] = value;
  }
  return validated;
}

// ── Error Type ───────────────────────────────────────────────────

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}
