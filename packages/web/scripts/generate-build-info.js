#!/usr/bin/env node
/**
 * Generate Build Info Script
 *
 * Automatically generates build-time metadata including:
 * - Version from package.json
 * - Git commit SHA (full and short)
 * - Build date/time
 * - Git branch
 *
 * This script is called during:
 * - Docker builds (via Dockerfile)
 * - Local development (via package.json scripts)
 * - CI/CD pipelines (GitHub Actions)
 *
 * Output formats:
 * - Environment variables (for runtime)
 * - JSON file (for static imports)
 * - Console output (for debugging)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Execute a git command safely
 * @param {string} command - Git command to execute
 * @param {string} fallback - Fallback value if command fails
 * @returns {string}
 */
function gitCommand(command, fallback = 'unknown') {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    return fallback;
  }
}

/**
 * Get version from package.json
 * @returns {string}
 */
function getVersion() {
  try {
    const packageJson = require('../package.json');
    return packageJson.version || '0.0.0';
  } catch (error) {
    return '0.0.0';
  }
}

/**
 * Generate build information
 * @returns {object}
 */
function generateBuildInfo() {
  const version = getVersion();
  const gitCommitSHA = gitCommand('git rev-parse HEAD', 'dev');
  const gitCommitSHAShort = gitCommand('git rev-parse --short HEAD', 'dev');
  const gitBranch = gitCommand('git rev-parse --abbrev-ref HEAD', 'unknown');
  const buildDate = new Date().toISOString();
  const buildTimestamp = Date.now();

  return {
    version,
    gitCommitSHA,
    gitCommitSHAShort,
    gitBranch,
    buildDate,
    buildTimestamp,
  };
}

/**
 * Generate .env file content
 * @param {object} buildInfo
 * @returns {string}
 */
function generateEnvContent(buildInfo) {
  return `# Auto-generated build info - DO NOT EDIT MANUALLY
# Generated at: ${buildInfo.buildDate}

NEXT_PUBLIC_APP_VERSION=${buildInfo.version}
NEXT_PUBLIC_GIT_COMMIT_SHA=${buildInfo.gitCommitSHA}
NEXT_PUBLIC_GIT_COMMIT_SHA_SHORT=${buildInfo.gitCommitSHAShort}
NEXT_PUBLIC_GIT_BRANCH=${buildInfo.gitBranch}
NEXT_PUBLIC_BUILD_DATE=${buildInfo.buildDate}
NEXT_PUBLIC_BUILD_TIMESTAMP=${buildInfo.buildTimestamp}
`;
}

/**
 * Main execution
 */
function main() {
  const buildInfo = generateBuildInfo();

  // Output to console
  console.log('📦 Build Information Generated:');
  console.log('================================');
  console.log(`Version:       ${buildInfo.version}`);
  console.log(`Commit (full): ${buildInfo.gitCommitSHA}`);
  console.log(`Commit (short):${buildInfo.gitCommitSHAShort}`);
  console.log(`Branch:        ${buildInfo.gitBranch}`);
  console.log(`Build Date:    ${buildInfo.buildDate}`);
  console.log('================================');

  // Write to JSON file (for static imports if needed)
  const buildInfoPath = path.join(__dirname, '..', 'build-info.json');
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2), 'utf8');
  console.log(`✅ Build info written to: ${buildInfoPath}`);

  // Write to .env.buildinfo file
  const envPath = path.join(__dirname, '..', '.env.buildinfo');
  fs.writeFileSync(envPath, generateEnvContent(buildInfo), 'utf8');
  console.log(`✅ Environment variables written to: ${envPath}`);

  // Export for shell scripts (optional)
  if (process.argv.includes('--export')) {
    console.log('\n# Export these variables in your shell:');
    console.log(`export NEXT_PUBLIC_APP_VERSION="${buildInfo.version}"`);
    console.log(
      `export NEXT_PUBLIC_GIT_COMMIT_SHA="${buildInfo.gitCommitSHA}"`
    );
    console.log(
      `export NEXT_PUBLIC_GIT_COMMIT_SHA_SHORT="${buildInfo.gitCommitSHAShort}"`
    );
    console.log(`export NEXT_PUBLIC_GIT_BRANCH="${buildInfo.gitBranch}"`);
    console.log(`export NEXT_PUBLIC_BUILD_DATE="${buildInfo.buildDate}"`);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateBuildInfo, generateEnvContent };
