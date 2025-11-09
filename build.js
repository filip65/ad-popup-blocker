#!/usr/bin/env node
/*
  Simple build script to produce:
  - dist-chrome/ (using manifest.chrome.json as manifest.json)
  - dist-firefox/ (using manifest.firefox.json as manifest.json)
*/

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const DIST_CHROME = path.join(ROOT, 'dist-chrome');
const DIST_FIREFOX = path.join(ROOT, 'dist-firefox');

const SRC_MANIFEST_CHROME = path.join(ROOT, 'manifest.chrome.json');
const SRC_MANIFEST_FIREFOX = path.join(ROOT, 'manifest.firefox.json');

const IGNORE_NAMES = new Set([
  '.git',
  '.gitignore',
  '.DS_Store',
  'node_modules',
  'dist-chrome',
  'dist-firefox'
]);

const IGNORE_FILES = new Set([
  'manifest.json',
  'manifest.chrome.json',
  'manifest.firefox.json',
  'build.js',
  'package.json',
  'package-lock.json'
]);

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(srcDir, destDir) {
  ensureDir(destDir);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_NAMES.has(entry.name)) continue;
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      if (IGNORE_FILES.has(entry.name)) continue;
      copyFile(srcPath, destPath);
    }
  }
}

function writeManifest(srcManifestPath, destDir) {
  const raw = fs.readFileSync(srcManifestPath, 'utf8');
  const json = JSON.parse(raw);
  const outPath = path.join(destDir, 'manifest.json');
  fs.writeFileSync(outPath, JSON.stringify(json, null, 2));
}

function build() {
  // Clean
  rmrf(DIST_CHROME);
  rmrf(DIST_FIREFOX);

  // Validate manifests exist
  if (!fs.existsSync(SRC_MANIFEST_CHROME)) {
    console.error('Missing manifest.chrome.json');
    process.exit(1);
  }
  if (!fs.existsSync(SRC_MANIFEST_FIREFOX)) {
    console.error('Missing manifest.firefox.json');
    process.exit(1);
  }

  // Build Chrome
  copyDir(ROOT, DIST_CHROME);
  writeManifest(SRC_MANIFEST_CHROME, DIST_CHROME);

  // Build Firefox
  copyDir(ROOT, DIST_FIREFOX);
  writeManifest(SRC_MANIFEST_FIREFOX, DIST_FIREFOX);

  // Create ZIPs
  const chromeManifest = JSON.parse(fs.readFileSync(SRC_MANIFEST_CHROME, 'utf8'));
  const firefoxManifest = JSON.parse(fs.readFileSync(SRC_MANIFEST_FIREFOX, 'utf8'));
  const baseName = (chromeManifest.name || 'extension')
    .toLowerCase()
    .replace(/\s+/g, '-');
  const chromeZip = `${baseName}-${chromeManifest.version || '0.0.0'}-chrome.zip`;
  const firefoxZip = `${baseName}-${firefoxManifest.version || '0.0.0'}-firefox.zip`;

  // Remove existing zips if present
  try { fs.unlinkSync(path.join(ROOT, chromeZip)); } catch (_) {}
  try { fs.unlinkSync(path.join(ROOT, firefoxZip)); } catch (_) {}

  // Zip using system 'zip' command
  try {
    execSync(`cd ${JSON.stringify(DIST_CHROME)} && zip -rq ${JSON.stringify(path.join('..', chromeZip))} .`);
    execSync(`cd ${JSON.stringify(DIST_FIREFOX)} && zip -rq ${JSON.stringify(path.join('..', firefoxZip))} .`);
    console.log(`Created ${chromeZip} and ${firefoxZip}`);
  } catch (err) {
    console.warn('Zipping failed. Ensure the "zip" command is available.');
  }

  console.log('Built dist-chrome and dist-firefox successfully.');
}

if (process.argv.includes('--clean')) {
  rmrf(DIST_CHROME);
  rmrf(DIST_FIREFOX);
  console.log('Cleaned dist directories.');
} else {
  build();
}
