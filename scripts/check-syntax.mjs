import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roots = ['src', 'public/assets/js'];
const files = [path.join(root, 'server.js')];

function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(absolute);
    else if (entry.isFile() && /\.(?:js|mjs)$/.test(entry.name)) files.push(absolute);
  }
}

for (const relative of roots) collect(path.join(root, relative));

let failed = false;
for (const file of files) {
  const isWorkerEntry = path.relative(root, file) === path.join('src', 'worker.js');
  const result = isWorkerEntry
    ? spawnSync(process.execPath, ['--input-type=module', '--check'], { input: fs.readFileSync(file, 'utf8'), encoding: 'utf8' })
    : spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed = true;
    process.stderr.write(`Syntax check failed: ${path.relative(root, file)}\n${result.stderr || result.stdout}`);
  }
}

if (failed) process.exitCode = 1;
else console.log(`Syntax check passed for ${files.length} JavaScript files.`);
