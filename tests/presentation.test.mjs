import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(resolve(root, 'assets/css/styles.css'), 'utf8');

test('styles define the warm editorial design system', () => {
  for (const token of ['--paper', '--sand', '--ink', '--muted', '--accent', '--line']) {
    assert.match(css, new RegExp(`${token}:`));
  }
  assert.match(css, /font-family:[^;]*(Microsoft YaHei|SimHei)/);
  assert.match(css, /\.site-header[\s\S]*position:\s*fixed/);
  assert.match(css, /\.project-grid/);
  assert.match(css, /\.hero__art/);
});

test('portrait and portfolio artwork preserve their intrinsic proportions', () => {
  assert.match(css, /\.about-portrait img\s*\{[^}]*height:\s*auto[^}]*object-fit:\s*contain/s);
  assert.match(css, /\.project-card__image img\s*\{[^}]*object-fit:\s*contain/s);
  assert.match(css, /\.hero__art img\s*\{[^}]*object-fit:\s*contain/s);
  assert.match(css, /\.motion-card__button img\s*\{[^}]*object-fit:\s*contain/s);
  assert.match(css, /\.linked-video-card__image img\s*\{[^}]*object-fit:\s*contain/s);
  assert.match(css, /\.project-media--long img\s*\{[^}]*max-height:\s*none[^}]*height:\s*auto/s);
});

test('portfolio content stays visible when local scripts or observers are unavailable', () => {
  assert.match(css, /\[data-reveal\]\s*\{[^}]*opacity:\s*1[^}]*transform:\s*none/s);
  assert.doesNotMatch(css, /\[data-reveal\]\s*\{[^}]*opacity:\s*0/s);
});

test('styles include responsive, focus and reduced motion behavior', () => {
  assert.match(css, /@media\s*\(max-width:\s*900px\)/);
  assert.match(css, /@media\s*\(max-width:\s*640px\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /dialog::backdrop/);
  assert.match(css, /aspect-ratio/);
  assert.match(css, /@media\s*\(max-width:\s*900px\)[\s\S]*\.project-detail__intro\s*\{[^}]*grid-column:\s*2/s);
});
