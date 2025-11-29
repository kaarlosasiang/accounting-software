#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(repoRoot, '..');
const pnpmVirtualStore = path.join(workspaceRoot, 'node_modules', '.pnpm');
const baseConfig = {
  compilerOptions: {
    lib: ['esnext', 'dom', 'dom.iterable'],
    types: ['node'],
  },
};

async function directoryExists(targetPath) {
  try {
    const stats = await fs.stat(targetPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureConfig(targetDirectory) {
  const destination = path.join(targetDirectory, 'tsconfig.base.json');
  if (await fileExists(destination)) {
    return false;
  }

  await fs.writeFile(destination, `${JSON.stringify(baseConfig, null, 2)}\n`, {
    encoding: 'utf8',
  });
  return true;
}

async function main() {
  if (!(await directoryExists(pnpmVirtualStore))) {
    return;
  }

  const entries = await fs.readdir(pnpmVirtualStore, { withFileTypes: true });
  const targetEntries = entries.filter(
    (entry) => entry.isDirectory() && entry.name.startsWith('@better-auth+core@'),
  );

  if (targetEntries.length === 0) {
    return;
  }

  const results = await Promise.all(
    targetEntries.map(async (entry) => {
      const nodeModulesDir = path.join(pnpmVirtualStore, entry.name, 'node_modules');
      if (!(await directoryExists(nodeModulesDir))) {
        return false;
      }
      return ensureConfig(nodeModulesDir);
    }),
  );

  if (results.some(Boolean)) {
    console.info('[better-auth] Added missing tsconfig.base.json for dependency.');
  }
}

main().catch((error) => {
  console.error('[better-auth] Failed to ensure tsconfig.base.json:', error);
  process.exitCode = 1;
});

