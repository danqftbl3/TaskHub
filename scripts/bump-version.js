#!/usr/bin/env node
/**
 * Bump version in all package.json files
 * Usage: node scripts/bump-version.js <patch|minor|major|version>
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(process.cwd());
const files = [
  'package.json',
  'shared/package.json',
  'mobile/package.json',
];

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number);
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      return type; // assume it's a full version string
  }
}

const type = process.argv[2] || 'patch';

let newVersion = '';
for (const file of files) {
  const path = resolve(ROOT, file);
  const pkg = JSON.parse(readFileSync(path, 'utf-8'));
  newVersion = bumpVersion(pkg.version, type);
  pkg.version = newVersion;
  writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`Updated ${file}: ${pkg.version} → ${newVersion}`);
}

console.log(`\nNew version: ${newVersion}`);
console.log('Run `git commit -am "chore: bump version to ' + newVersion + '" && git tag v' + newVersion + ' && git push --follow-tags`');