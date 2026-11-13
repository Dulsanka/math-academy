import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const htmlFiles = [];
function collectHtml(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) collectHtml(absolute);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(absolute);
  }
}
collectHtml(PUBLIC);

function attributes(source) {
  const output = {};
  for (const match of source.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    output[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return output;
}

test('all public HTML pages declare language and viewport and have unique IDs', () => {
  assert.ok(htmlFiles.length >= 4);
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /<html\b[^>]*\blang\s*=\s*["'][a-z-]+["']/i, `${path.relative(PUBLIC, file)} declares document language`);
    assert.match(html, /<meta\b[^>]*name\s*=\s*["']viewport["']/i, `${path.relative(PUBLIC, file)} declares a viewport`);
    const ids = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]);
    assert.equal(ids.length, new Set(ids).size, `${path.relative(PUBLIC, file)} has unique IDs`);
  }
});

test('static buttons have types and accessible names; local links resolve', () => {
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    for (const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button\s*>/gi)) {
      const attr = attributes(match[1]);
      const label = (match[2].replace(/<[^>]*>/g, ' ').replace(/&(?:amp|nbsp|lt|gt|quot);/g, ' ').trim() || attr['aria-label'] || attr.title || '').trim();
      assert.ok(['button', 'submit', 'reset'].includes(attr.type), `${path.relative(PUBLIC, file)} button has a type`);
      assert.ok(label, `${path.relative(PUBLIC, file)} button has an accessible name`);
    }
    for (const match of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
      const url = match[1];
      if (!url.startsWith('/') || url.startsWith('//') || url.includes('#')) continue;
      const pathname = url.split('?')[0];
      let mapped = pathname;
      if (pathname === '/admin.css') mapped = '/assets/css/admin.css';
      if (pathname === '/admin.js') mapped = '/assets/js/admin.js';
      if (pathname === '/admin.html') mapped = '/admin.html';
      if (pathname === '/account.js') mapped = '/assets/js/account.js';
      if (pathname === '/parent.js') mapped = '/assets/js/parent.js';
      if (/^\/(?:1_interactive|[2-9]_year\d+)_/.test(pathname)) continue; // Worker-mapped workbook route.
      assert.ok(fs.existsSync(path.join(PUBLIC, mapped.slice(1))), `${path.relative(PUBLIC, file)} local asset ${url} exists`);
    }
  }
});

