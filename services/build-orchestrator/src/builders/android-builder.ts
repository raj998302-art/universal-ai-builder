/**
 * Native Android build logic.
 *
 * Generates Gradle commands for assembleRelease / bundleRelease,
 * handles both APK and AAB output, and extracts artifacts.
 */

import path from 'path';
import { sanitizeShellArg, validateExtraArgs, validateEnvVars } from '../security';
import { config } from '../config';

export interface AndroidBuildOptions {
  buildType: 'apk' | 'aab';
  releaseMode?: boolean;
  flavor?: string;
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
 * Generate the Docker command list for a native Android build.
 */
export function generateAndroidBuildCommand(options: AndroidBuildOptions): BuildCommand {
  const isRelease = options.releaseMode !== false;
  const buildVariant = isRelease ? 'Release' : 'Debug';

  // Determine the Gradle task
  let gradleTask: string;
  if (options.buildType === 'aab') {
    gradleTask = options.flavor
      ? `bundle${capitalize(options.flavor)}${buildVariant}`
      : `bundle${buildVariant}`;
  } else {
    gradleTask = options.flavor
      ? `assemble${capitalize(options.flavor)}${buildVariant}`
      : `assemble${buildVariant}`;
  }

  // Build Gradle arguments
  const gradleArgs: string[] = [];

  if (options.buildNumber) {
    gradleArgs.push(`-PversionCode=${sanitizeShellArg(options.buildNumber)}`);
  }

  if (options.buildName) {
    gradleArgs.push(`-PversionName=${sanitizeShellArg(options.buildName)}`);
  }

  if (options.extraArgs && options.extraArgs.length > 0) {
    gradleArgs.push(...validateExtraArgs(options.extraArgs));
  }

  // Determine the Gradle wrapper or fallback
  const gradlew = './gradlew';

  const script = [
    'set -e',
    '',
    '# Detect Gradle wrapper',
    `if [ -f "${gradlew}" ]; then`,
    `  GRADLE="${gradlew}"`,
    `  chmod +x "${gradlew}"`,
    'else',
    '  GRADLE="gradle"',
    'fi',
    '',
    'echo "=== Android Build Environment ==="',
    'echo "ANDROID_HOME=$ANDROID_HOME"',
    'echo "JAVA_HOME=$JAVA_HOME"',
    'java -version 2>&1 || true',
    'echo ""',
    '',
    'echo "=== Running Gradle Task: ${GRADLE} ' + gradleTask + ' ==="',
    `$GRADLE ${gradleTask} ${gradleArgs.join(' ')}`.trim(),
    '',
    'echo ""',
    'echo "=== Build complete ==="',
    '',
    '# List output artifacts',
    `echo "=== Artifacts ==="`,
    `find app/build/outputs -name "*.${options.buildType === 'aab' ? 'aab' : 'apk'}" -type f 2>/dev/null || true`,
    `find build/outputs -name "*.${options.buildType === 'aab' ? 'aab' : 'apk'}" -type f 2>/dev/null || true`,
  ].join('\n');

  // Determine artifact output paths
  const artifactPaths: string[] = [];
  const flavorDir = options.flavor ? `${options.flavor}/` : '';
  const variantLower = buildVariant.toLowerCase();

  if (options.buildType === 'aab') {
    artifactPaths.push(
      `app/build/outputs/bundle/${flavorDir}${variantLower}/app-${options.flavor ? options.flavor + '-' : ''}${variantLower}.aab`
    );
    // Also check common alternative paths
    artifactPaths.push(
      `app/build/outputs/bundle/${flavorDir}${variantLower}/app.aab`
    );
  } else {
    artifactPaths.push(
      `app/build/outputs/apk/${flavorDir}${variantLower}/app-${options.flavor ? options.flavor + '-' : ''}${variantLower}.apk`
    );
    artifactPaths.push(
      `app/build/outputs/apk/${flavorDir}${variantLower}/app.apk`
    );
  }

  // Process environment variables
  const envVars: Record<string, string> = {
    CI: 'true',
    GRADLE_OPTS: '-Dorg.gradle.daemon=false -Dorg.gradle.workers.max=2 -Xmx2g',
  };

  if (options.envVars) {
    Object.assign(envVars, validateEnvVars(options.envVars));
  }

  return {
    image: config.images.android,
    command: ['bash', '-c', script],
    envVars,
    artifactPaths,
  };
}

/**
 * Generate the command for syncing Gradle dependencies only.
 */
export function generateAndroidInstallCommand(): BuildCommand {
  const script = [
    'set -e',
    '',
    'if [ -f "./gradlew" ]; then',
    '  chmod +x ./gradlew',
    '  echo "=== Syncing Gradle dependencies ==="',
    '  ./gradlew dependencies --refresh-dependencies',
    'else',
    '  echo "=== Syncing Gradle dependencies ==="',
    '  gradle dependencies --refresh-dependencies',
    'fi',
    '',
    'echo "=== Dependencies synced ==="',
  ].join('\n');

  return {
    image: config.images.android,
    command: ['bash', '-c', script],
    envVars: {
      CI: 'true',
      GRADLE_OPTS: '-Dorg.gradle.daemon=false -Xmx2g',
    },
    artifactPaths: [],
  };
}

/**
 * Get the expected artifact file name for download.
 */
export function getAndroidArtifactFileName(
  projectName: string,
  buildType: 'apk' | 'aab',
  flavor?: string
): string {
  const ext = buildType === 'aab' ? 'aab' : 'apk';
  const flavorSuffix = flavor ? `-${flavor}` : '';
  return `${projectName}${flavorSuffix}-release.${ext}`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
