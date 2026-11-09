/**
 * Flutter build logic.
 *
 * Generates Docker commands for building Flutter APK and AAB artifacts,
 * handles `flutter pub get`, `flutter build apk/appbundle`, and
 * extracts the resulting artifacts from the container workspace.
 */

import path from 'path';
import { sanitizeShellArg, validateExtraArgs, validateEnvVars } from '../security';
import { config } from '../config';

export interface FlutterBuildOptions {
  buildType: 'apk' | 'aab';
  releaseMode?: boolean;
  flavor?: string;
  target?: string;
  buildNumber?: string;
  buildName?: string;
  extraArgs?: string[];
  envVars?: Record<string, string>;
}

export interface BuildCommand {
  image: string;
  command: string[];
  envVars: Record<string, string>;
  artifactPaths: string[];
}

/**
 * Generate the Docker command list for a Flutter build.
 */
export function generateFlutterBuildCommand(options: FlutterBuildOptions): BuildCommand {
  const mode = options.releaseMode !== false ? '--release' : '--debug';

  // Determine the flutter build sub-command
  const buildSubCommand = options.buildType === 'aab' ? 'appbundle' : 'apk';

  // Build the argument list
  const args: string[] = [];

  if (options.flavor) {
    args.push('--flavor', sanitizeShellArg(options.flavor));
  }

  if (options.target) {
    args.push('--target', sanitizeShellArg(options.target));
  }

  if (options.buildNumber) {
    args.push('--build-number', sanitizeShellArg(options.buildNumber));
  }

  if (options.buildName) {
    args.push('--build-name', sanitizeShellArg(options.buildName));
  }

  if (options.extraArgs && options.extraArgs.length > 0) {
    args.push(...validateExtraArgs(options.extraArgs));
  }

  // Build the full shell script to run inside the container
  const script = [
    'set -e',
    'echo "=== Flutter Doctor ==="',
    'flutter doctor -v',
    'echo ""',
    'echo "=== Installing dependencies ==="',
    'flutter pub get',
    'echo ""',
    `echo "=== Building Flutter ${buildSubCommand} (${mode}) ==="`,
    `flutter build ${buildSubCommand} ${mode} ${args.join(' ')}`.trim(),
    'echo ""',
    'echo "=== Build complete ==="',
    // List the output artifacts
    `find build/app/outputs -name "*.${options.buildType === 'aab' ? 'aab' : 'apk'}" -type f 2>/dev/null || true`,
  ].join('\n');

  // Determine artifact paths
  const artifactPaths =
    options.buildType === 'aab'
      ? ['build/app/outputs/bundle/release/app-release.aab']
      : ['build/app/outputs/flutter-apk/app-release.apk'];

  // Add flavor-specific paths
  if (options.flavor) {
    const flavorLower = options.flavor.toLowerCase();
    if (options.buildType === 'aab') {
      artifactPaths.push(`build/app/outputs/bundle/${flavorLower}Release/app-${flavorLower}-release.aab`);
    } else {
      artifactPaths.push(`build/app/outputs/flutter-apk/app-${flavorLower}-release.apk`);
    }
  }

  // Process environment variables
  const envVars: Record<string, string> = {
    CI: 'true',
    FLUTTER_BUILD_MODE: options.releaseMode !== false ? 'release' : 'debug',
  };

  if (options.envVars) {
    Object.assign(envVars, validateEnvVars(options.envVars));
  }

  return {
    image: config.images.flutter,
    command: ['bash', '-c', script],
    envVars,
    artifactPaths,
  };
}

/**
 * Generate the command for installing Flutter dependencies only.
 */
export function generateFlutterInstallCommand(): BuildCommand {
  const script = [
    'set -e',
    'echo "=== Installing Flutter dependencies ==="',
    'flutter pub get',
    'echo "=== Dependencies installed ==="',
  ].join('\n');

  return {
    image: config.images.flutter,
    command: ['bash', '-c', script],
    envVars: { CI: 'true' },
    artifactPaths: [],
  };
}

/**
 * Get the expected artifact file name for download.
 */
export function getFlutterArtifactFileName(
  projectName: string,
  buildType: 'apk' | 'aab',
  flavor?: string
): string {
  const ext = buildType === 'aab' ? 'aab' : 'apk';
  const flavorSuffix = flavor ? `-${flavor}` : '';
  return `${projectName}${flavorSuffix}-release.${ext}`;
}
