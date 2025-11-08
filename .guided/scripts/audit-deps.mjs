#!/usr/bin/env node

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..', '..');

const packagePaths = [
  'package.json',
  'apps/web/package.json',
  'infra/pulumi/gcp/package.json',
];

function getLatestVersion(packageName) {
  try {
    const result = execSync(`pnpm view ${packageName} version`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.trim();
  } catch (error) {
    return 'ERROR';
  }
}

function compareVersions(current, latest) {
  const cleanCurrent = current.replace(/^[\^~>=<]/, '');
  const cleanLatest = latest;

  const [currMajor, currMinor, currPatch] = cleanCurrent.split('.').map(Number);
  const [latestMajor, latestMinor, latestPatch] = cleanLatest
    .split('.')
    .map(Number);

  if (currMajor < latestMajor) return 'major';
  if (currMinor < latestMinor) return 'minor';
  if (currPatch < latestPatch) return 'patch';
  return 'current';
}

const results = [];

for (const pkgPath of packagePaths) {
  const fullPath = join(rootDir, pkgPath);
  const pkg = JSON.parse(readFileSync(fullPath, 'utf8'));

  console.error(`\n📦 Analyzing: ${pkgPath}`);

  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  for (const [name, version] of Object.entries(allDeps)) {
    const latest = getLatestVersion(name);
    const changeType =
      latest !== 'ERROR' ? compareVersions(version, latest) : 'error';

    results.push({
      package: pkgPath,
      name,
      current: version,
      latest,
      changeType,
      isDev: !!pkg.devDependencies?.[name],
    });

    console.error(`  ${name}: ${version} → ${latest} (${changeType})`);
  }
}

console.log(JSON.stringify(results, null, 2));
