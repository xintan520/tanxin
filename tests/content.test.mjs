import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('page identifies Tan Xin and contains every required section', () => {
  const html = read('index.html');
  assert.match(html, /谭鑫/);
  assert.match(html, /TAN XIN/);
  assert.match(html, /3533435725@qq\.com/);
  for (const id of ['home', 'about', 'works', 'video-showcase', 'motion', 'contact']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  const order = ['home', 'about', 'works', 'video-showcase', 'motion', 'contact']
    .map((id) => html.indexOf(`id="${id}"`));
  assert.deepEqual(order, [...order].sort((a, b) => a - b), 'about must be the second screen before the work sections');
  assert.doesNotMatch(html, /耿王璟/);
});

function loadProjectData() {
  const context = vm.createContext({});
  vm.runInContext(read('assets/js/projects.js'), context);
  return {
    PORTFOLIO_PROJECTS: context.PORTFOLIO_PROJECTS,
    VIDEO_SHOWCASE: context.VIDEO_SHOWCASE,
  };
}

test('project data groups every supplied asset into a curated project', () => {
  const { PORTFOLIO_PROJECTS, VIDEO_SHOWCASE } = loadProjectData();
  assert.ok(PORTFOLIO_PROJECTS.length >= 8);
  const categories = new Set(PORTFOLIO_PROJECTS.map((project) => project.category));
  for (const category of ['brand', 'packaging', 'poster', 'editorial', 'cultural', 'motion']) {
    assert.ok(categories.has(category), `missing category ${category}`);
  }

  const manifest = JSON.parse(read('assets/data/asset-manifest.json'));
  const html = read('index.html');
  const referenced = new Set([
    ...PORTFOLIO_PROJECTS.flatMap((project) => [project.cover, ...project.media.map((item) => item.src), ...project.media.map((item) => item.poster).filter(Boolean)]),
    ...VIDEO_SHOWCASE.map((item) => item.poster),
  ]);
  for (const item of manifest.items) {
    assert.ok(referenced.has(item.webPath) || html.includes(item.webPath), `${item.webPath} must be used`);
    if (item.posterPath) assert.ok(referenced.has(item.posterPath), `${item.posterPath} must be used`);
  }
});

test('four linked video screenshots and every supplied full-video link are present', () => {
  const { VIDEO_SHOWCASE } = loadProjectData();
  assert.equal(VIDEO_SHOWCASE.length, 4);
  assert.ok(VIDEO_SHOWCASE.every((item) => /video-link-0[1-4]\.webp$/.test(item.poster)));
  assert.ok(VIDEO_SHOWCASE.every((item) => item.label === '视频截图'));
  const source = read('assets/js/projects.js');
  const links = [...source.matchAll(/https:\/\/weixin\.qq\.com\/sph\/[A-Za-z0-9]+/g)].map((match) => match[0]);
  assert.equal(new Set(links).size, 6);
});

test('Ruihu VI manual fills the final grid slot and opens the complete long image', () => {
  const { PORTFOLIO_PROJECTS } = loadProjectData();
  const project = PORTFOLIO_PROJECTS.find((item) => item.id === 'ruihu-vi-manual');
  assert.ok(project, 'Ruihu VI manual project must exist');
  assert.equal(PORTFOLIO_PROJECTS.at(-1).id, 'ruihu-vi-manual');
  assert.equal(project.cover, 'assets/images/ruihu-vi-cover.webp');
  assert.deepEqual(Array.from(project.media, (item) => item.src), ['assets/images/ruihu-vi-full.webp']);
  assert.equal(project.media[0].layout, 'long');
});

test('the site can render when index.html is opened directly from disk', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /type=["']module["']/);
  assert.match(html, /<script src="assets\/js\/projects\.js" defer><\/script>/);
  assert.match(html, /<script src="assets\/js\/app\.js" defer><\/script>/);
  assert.doesNotMatch(read('assets/js/projects.js'), /^\s*(?:import|export)\s/m);
  assert.doesNotMatch(read('assets/js/app.js'), /^\s*(?:import|export)\s/m);
});

test('site has no external runtime or font dependency', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)=["']https?:\/\//i);
  assert.doesNotMatch(html, /fonts\.googleapis|cdnjs|unpkg|jsdelivr/i);
});
