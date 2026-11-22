#!/usr/bin/env node
/** Offline dependency readiness gate: no network, no installs, no synthetic PASS. */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const rootLock = lock.packages?.[''] || {};
const failures = [];
const info = [];
for (const field of ['dependencies', 'devDependencies']) {
  const wanted = pkg[field] || {};
  const locked = rootLock[field] || {};
  for (const [name, version] of Object.entries(wanted)) {
    if (locked[name] !== version) failures.push(`LOCK_MISMATCH ${field} ${name}: package=${version}, lock=${locked[name] ?? 'MISSING'}`);
    const installedPkg = path.join(root, 'node_modules', ...name.split('/'), 'package.json');
    if (!fs.existsSync(installedPkg)) {
      failures.push(`MISSING_DEPENDENCY ${name}`);
    } else {
      try { JSON.parse(fs.readFileSync(installedPkg, 'utf8')); }
      catch { failures.push(`INVALID_DEPENDENCY ${name}`); }
    }
  }
}
const bins = ['typescript/bin/tsc', 'vite/bin/vite.js'];
for (const bin of bins) if (!fs.existsSync(path.join(root, 'node_modules', bin))) failures.push(`MISSING_EXECUTABLE ${bin}`);
const version = process.versions.node.split('.').map(Number);
if (version[0] < 22) failures.push(`UNSUPPORTED_NODE ${process.version}; project CI uses Node 22`);
info.push(`Node ${process.version}; platform ${process.platform}/${process.arch}`);
console.log(info.join('\n'));
if (failures.length) {
  console.error(`DEPENDENCY_PREFLIGHT_BLOCKED (${failures.length} issue(s))`);
  failures.forEach(x => console.error(` - ${x}`));
  console.error('Run npm ci on a machine with access to the npm registry, then rerun npm run check:dependencies.');
  process.exitCode = 1;
} else console.log('DEPENDENCY_PREFLIGHT_PASS');
