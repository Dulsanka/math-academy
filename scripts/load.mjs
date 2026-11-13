import fs from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requestCount = readNumberArg('requests', 250, 1, 10_000);
const concurrency = readNumberArg('concurrency', 20, 1, 500);
const username = `load_admin_${process.pid}`;
const password = 'Load-test-only-passphrase-2026';
let server;
let dataDir;
let port;

function readNumberArg(name, fallback, min, max) {
  const argument = process.argv.find(value => value.startsWith(`--${name}=`));
  const value = argument ? Number(argument.slice(name.length + 3)) : fallback;
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`--${name} must be an integer from ${min} to ${max}.`);
  return value;
}

async function unusedPort() {
  const socket = net.createServer();
  socket.listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const selectedPort = socket.address().port;
  await new Promise((resolve, reject) => socket.close(error => error ? reject(error) : resolve()));
  return selectedPort;
}

async function waitForServer(baseUrl, stderr) {
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Local server exited during startup. ${stderr()}`);
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch { /* Wait for the listener to become ready. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Local server did not become ready. ${stderr()}`);
}

async function main() {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'math-academy-load-'));
  port = await unusedPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, [path.join(root, 'src/local-server.js')], {
    cwd: root,
    env: { ...process.env, DATA_DIR: dataDir, PORT: String(port), HOST: '127.0.0.1', BOOTSTRAP_ADMIN_USERNAME: username, BOOTSTRAP_ADMIN_PASSWORD: password },
    stdio: ['ignore', 'ignore', 'pipe']
  });
  let serverError = '';
  server.stderr.on('data', chunk => { serverError += chunk.toString(); });
  await waitForServer(baseUrl, () => serverError);

  const origin = baseUrl;
  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!login.ok) throw new Error(`Load-test administrator login failed (${login.status}).`);
  const cookie = login.headers.get('set-cookie')?.split(';', 1)[0];
  if (!cookie) throw new Error('Local server did not return a session cookie.');

  const routes = ['/', '/assets/css/site.css', '/api/auth/me', '/api/admin/users'];
  const durations = [];
  const failures = [];
  let cursor = 0;
  const started = performance.now();
  const workers = Array.from({ length: Math.min(concurrency, requestCount) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= requestCount) return;
      const route = routes[index % routes.length];
      const requestStarted = performance.now();
      try {
        const response = await fetch(baseUrl + route, { headers: { Cookie: cookie } });
        await response.arrayBuffer();
        const elapsed = performance.now() - requestStarted;
        durations.push(elapsed);
        if (!response.ok) failures.push(`${route}: HTTP ${response.status}`);
      } catch (error) { failures.push(`${route}: ${error.message}`); }
    }
  });
  await Promise.all(workers);
  const elapsedMs = performance.now() - started;
  durations.sort((a, b) => a - b);
  const percentile = fraction => durations[Math.min(durations.length - 1, Math.ceil(durations.length * fraction) - 1)] || 0;
  const mean = durations.reduce((total, sample) => total + sample, 0) / Math.max(1, durations.length);
  console.log(`Local Math Academy load run: ${requestCount} requests, concurrency ${concurrency}`);
  console.log(`Elapsed: ${(elapsedMs / 1000).toFixed(2)}s · Throughput: ${(requestCount / (elapsedMs / 1000)).toFixed(1)} req/s`);
  console.log(`Latency: avg ${mean.toFixed(1)}ms · p50 ${percentile(.50).toFixed(1)}ms · p95 ${percentile(.95).toFixed(1)}ms · p99 ${percentile(.99).toFixed(1)}ms`);
  console.log(`HTTP/network failures: ${failures.length}`);
  if (failures.length) {
    for (const failure of failures.slice(0, 10)) console.error(`  ${failure}`);
    process.exitCode = 1;
  }
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (server && server.exitCode === null) {
    server.kill();
    await Promise.race([once(server, 'exit'), new Promise(resolve => setTimeout(resolve, 3000))]);
  }
  if (dataDir) {
    const safeTempRoot = path.resolve(os.tmpdir());
    const resolved = path.resolve(dataDir);
    if (resolved.startsWith(safeTempRoot + path.sep) && path.basename(resolved).startsWith('math-academy-load-')) {
      await fs.rm(resolved, { recursive: true, force: true });
    }
  }
}
