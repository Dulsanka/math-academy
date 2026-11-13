import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(root, 'public');

function read(relative) {
  return fs.readFileSync(path.join(publicRoot, relative), 'utf8');
}

function attributes(source) {
  const result = {};
  for (const match of source.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    result[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return result;
}

test('parent and admin section navigation targets an existing view and retains deep links', () => {
  const cases = [
    { html: read('admin.html'), key: 'data-admin-page', views: /id="view-([^"]+)"/g, prefix: '' },
    { html: read('parent.html'), key: 'data-parent-page', views: /data-parent-view="([^"]+)"/g, prefix: '' }
  ];
  for (const item of cases) {
    const pages = [...item.html.matchAll(new RegExp(`${item.key}="([^"]+)"`, 'g'))].map(match => match[1]);
    const views = [...item.html.matchAll(item.views)].map(match => match[1]);
    assert.ok(pages.length >= 3, 'section navigation has distinct destinations');
    for (const page of pages) assert.ok(views.includes(item.prefix + page), `navigation destination ${page} has a matching view`);
  }
  assert.doesNotMatch(cases[0].html, /data-admin-page="progress"|id="view-progress"/);
  assert.match(cases[1].html, /href="#children"/);
  assert.match(read('assets/js/parent.js'), /'parent-portal': 'children'/, 'older parent portal links keep working');
});

test('login has a labelled role selector without a public administrator option', () => {
  const html = read('index.html');
  assert.match(html, /<label for="login-account-type">/);
  assert.match(html, /<select id="login-account-type" name="accountType"/);
  assert.match(html, /<option value="parent">/);
  assert.match(html, /<option value="child">/);
  assert.doesNotMatch(html, /<option[^>]+value="admin"|name="accountType"[^>]*value="admin"/i);
  assert.match(read('assets/js/site.js'), /actualType === 'admin'.*window\.location\.assign\('\/admin\.html'\)/s);
});

test('login watermark preview offers four local, persistent design choices', () => {
  const html = read('index.html');
  const choices = [...html.matchAll(/<option value="(fern|stars|contours|pohutukawa)">/g)].map(match => match[1]);
  assert.deepEqual(choices, ['fern', 'stars', 'contours', 'pohutukawa']);
  const script = read('assets/js/site.js');
  assert.match(script, /get\('designPreview'\) === '1'/, 'design controls are limited to the preview URL');
  assert.match(script, /if \(designPreviewMode\) \{\s*showSignedOut\(\);/, 'preview remains visible even when a login session exists');
  assert.match(script, /math-academy-nz-design-preview/);
  for (const asset of ['silver-fern.svg', 'southern-cross.svg', 'aotearoa-contours.svg', 'pohutukawa.svg']) {
    assert.ok(fs.existsSync(path.join(publicRoot, 'assets', 'images', 'nz-watermarks', asset)), `${asset} watermark exists`);
  }
});

test('form controls on access and account pages have associated labels', () => {
  const pages = ['index.html', 'register.html', 'parent-register.html', 'account.html', 'admin.html', 'parent.html'];
  for (const page of pages) {
    const html = read(page);
    for (const match of html.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)) {
      const attr = attributes(match[2]);
      if (['hidden', 'submit', 'button', 'reset'].includes((attr.type || '').toLowerCase())) continue;
      const id = attr.id;
      const explicit = id && new RegExp(`<label\\b[^>]*\\bfor=["']${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i').test(html);
      const ariaNamed = Boolean(attr['aria-label'] || attr['aria-labelledby']);
      const prior = html.slice(0, match.index).lastIndexOf('<label');
      const close = html.indexOf('</label>', match.index);
      const wrapped = prior >= 0 && close >= match.index && !html.slice(prior, match.index).includes('</label>');
      assert.ok(explicit || wrapped || ariaNamed, `${page} ${attr.name || attr.id || match[1]} has an accessible name`);
    }
  }
});

test('main interactive pages provide keyboard focus indicators and responsive viewport metadata', () => {
  const styles = read('assets/css/site.css') + read('assets/css/access.css') + read('assets/css/admin.css') + read('assets/css/parent.css');
  assert.match(styles, /:focus-visible/);
  for (const page of ['index.html', 'admin.html', 'parent.html']) {
    assert.match(read(page), /<meta\s+name="viewport"/i, `${page} supports responsive viewport sizing`);
  }
});
