/**
 * Web project build logic.
 *
 * Detects the package manager (npm, pnpm, yarn, bun), runs install
 * and build commands, and packages the output directory as a ZIP.
 */

import path from 'path';
import { validateExtraArgs, validateEnvVars } from '../security';
import { config } from '../config';

export interface WebBuildOptions {
  releaseMode?: boolean;
  extraArgs?: string[];
  envVars?: Record<string, string>;
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun';
  buildCommand?: string;
  outputDir?: string;
}

export interface BuildCommand {
  image: string;
  command: string[];
  envVars: Record<string, string>;
  artifactPaths: string[];
}

/**
 * Generate the Docker command for a web project build.
 */
export function generateWebBuildCommand(options: WebBuildOptions): BuildCommand {
  const extraArgStr =
    options.extraArgs && options.extraArgs.length > 0
      ? ' ' + validateExtraArgs(options.extraArgs).join(' ')
      : '';

  // The script auto-detects the package manager if not specified
  const script = [
    'set -e',
    '',
    '# ── Detect package manager ──',
    'detect_pm() {',
    '  if [ -n "${FORCE_PM:-}" ]; then echo "$FORCE_PM"; return; fi',
    '  if [ -f "bun.lockb" ] || [ -f "bun.lock" ]; then echo "bun"; return; fi',
    '  if [ -f "pnpm-lock.yaml" ]; then echo "pnpm"; return; fi',
    '  if [ -f "yarn.lock" ]; then echo "yarn"; return; fi',
    '  echo "npm"',
    '}',
    '',
    'PM=$(detect_pm)',
    'echo "=== Detected package manager: $PM ==="',
    '',
    '# ── Install dependencies ──',
    'echo "=== Installing dependencies ==="',
    'case "$PM" in',
    '  bun)   bun install --frozen-lockfile 2>/dev/null || bun install ;;',
    '  pnpm)  pnpm install --frozen-lockfile 2>/dev/null || pnpm install ;;',
    '  yarn)  yarn install --frozen-lockfile 2>/dev/null || yarn install ;;',
    '  npm)   npm ci 2>/dev/null || npm install ;;',
    'esac',
    '',
    '# ── Run build ──',
    'echo "=== Building project ==="',
    `BUILD_CMD="\${CUSTOM_BUILD_CMD:-$PM run build${extraArgStr}}"`,
    'echo "Running: $BUILD_CMD"',
    'eval "$BUILD_CMD"',
    '',
    '# ── Package output ──',
    'echo "=== Packaging output ==="',
    '',
    '# Detect output directory',
    'detect_output() {',
    '  if [ -n "${CUSTOM_OUTPUT_DIR:-}" ]; then echo "$CUSTOM_OUTPUT_DIR"; return; fi',
    '  for dir in dist build out .next/static public/build .output/public; do',
    '    if [ -d "$dir" ]; then echo "$dir"; return; fi',
    '  done',
    '  echo "dist"',
    '}',
    '',
    'OUTPUT_DIR=$(detect_output)',
    'echo "Output directory: $OUTPUT_DIR"',
    '',
    'if [ -d "$OUTPUT_DIR" ]; then',
    '  cd "$OUTPUT_DIR"',
    '  zip -r /workspace/build-output.zip . -x "*.map"',
    '  cd /workspace',
    '  echo "=== Build packaged: build-output.zip ==="',
    '  ls -lh build-output.zip',
    'else',
    '  echo "WARNING: Output directory $OUTPUT_DIR not found"',
    '  exit 1',
    'fi',
    '',
    'echo "=== Build complete ==="',
  ].join('\n');

  // Process environment variables
  const envVars: Record<string, string> = {
    CI: 'true',
    NODE_ENV: options.releaseMode !== false ? 'production' : 'development',
  };

  if (options.packageManager) {
    envVars.FORCE_PM = options.packageManager;
  }

  if (options.buildCommand) {
    envVars.CUSTOM_BUILD_CMD = options.buildCommand;
  }

  if (options.outputDir) {
    envVars.CUSTOM_OUTPUT_DIR = options.outputDir;
  }

  if (options.envVars) {
    Object.assign(envVars, validateEnvVars(options.envVars));
  }

  return {
    image: config.images.node,
    command: ['sh', '-c', script],
    envVars,
    artifactPaths: ['build-output.zip'],
  };
}

/**
 * Generate the command for installing web dependencies only.
 */
export function generateWebInstallCommand(
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun'
): BuildCommand {
  const script = [
    'set -e',
    '',
    '# Detect package manager',
    'detect_pm() {',
    '  if [ -n "${FORCE_PM:-}" ]; then echo "$FORCE_PM"; return; fi',
    '  if [ -f "bun.lockb" ] || [ -f "bun.lock" ]; then echo "bun"; return; fi',
    '  if [ -f "pnpm-lock.yaml" ]; then echo "pnpm"; return; fi',
    '  if [ -f "yarn.lock" ]; then echo "yarn"; return; fi',
    '  echo "npm"',
    '}',
    '',
    'PM=$(detect_pm)',
    'echo "=== Installing dependencies with $PM ==="',
    'case "$PM" in',
    '  bun)   bun install ;;',
    '  pnpm)  pnpm install ;;',
    '  yarn)  yarn install ;;',
    '  npm)   npm install ;;',
    'esac',
    '',
    'echo "=== Dependencies installed ==="',
  ].join('\n');

  const envVars: Record<string, string> = { CI: 'true' };
  if (packageManager) {
    envVars.FORCE_PM = packageManager;
  }

  return {
    image: config.images.node,
    command: ['sh', '-c', script],
    envVars,
    artifactPaths: [],
  };
}

/**
 * Get the expected artifact file name.
 */
export function getWebArtifactFileName(projectName: string): string {
  return `${projectName}-build.zip`;
}
