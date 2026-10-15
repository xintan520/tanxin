import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('page exposes the corrected build identifier so local copies can be distinguished', () => {
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  assert.match(html, /data-build="2026\.10\.14-r2"/);
  assert.match(html, /2026\.10\.14 修正版 R2/);
});

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

test('GitHub Pages delivery files exist and document deployment', () => {
  for (const file of ['.nojekyll', 'README.md', '404.html']) {
    assert.ok(existsSync(resolve(root, file)), `${file} must exist`);
  }
  const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
  assert.match(readme, /GitHub Pages/);
  assert.match(readme, /添加新视频/);
});

test('all HTML local links resolve with relative paths', () => {
  for (const htmlName of ['index.html', '404.html']) {
    const html = readFileSync(resolve(root, htmlName), 'utf8');
    const refs = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map((match) => match[1]);
    for (const ref of refs) {
      if (/^(#|mailto:|tel:|https?:)/.test(ref)) continue;
      assert.doesNotMatch(ref, /^(?:https?:|\/|file:)/, `${ref} must remain repository-relative`);
      assert.ok(existsSync(resolve(root, ref.split(/[?#]/)[0])), `${htmlName}: missing ${ref}`);
    }
  }
});

test('published source contains no local machine path or oversized file', () => {
  const files = walk(root).filter((path) => !path.includes('/.git/') && !path.includes('/.superpowers/'));
  for (const file of files) {
    assert.ok(statSync(file).size < 100 * 1024 * 1024, `${file} exceeds GitHub file limit`);
    if (['.html', '.css', '.js', '.md', '.json'].includes(extname(file))) {
      const text = readFileSync(file, 'utf8');
      assert.doesNotMatch(text, /\/workspace\/|file:\/\//, `${file} leaks an absolute local path`);
    }
  }
});
