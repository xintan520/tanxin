import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadScripts() {
  const context = vm.createContext({ console });
  vm.runInContext(readFileSync(resolve(root, 'assets/js/projects.js'), 'utf8'), context);
  vm.runInContext(readFileSync(resolve(root, 'assets/js/app.js'), 'utf8'), context);
  return context;
}

test('filterProjects returns all projects or the selected category', () => {
  const { PORTFOLIO_PROJECTS, PORTFOLIO_APP: { filterProjects } } = loadScripts();
  assert.equal(filterProjects(PORTFOLIO_PROJECTS, 'all').length, PORTFOLIO_PROJECTS.length);
  const packaging = filterProjects(PORTFOLIO_PROJECTS, 'packaging');
  assert.equal(packaging.length, 2);
  assert.ok(packaging.every((project) => project.category === 'packaging'));
  assert.equal(filterProjects(PORTFOLIO_PROJECTS, 'missing').length, 0);
});

test('createMediaMarkup builds accessible image and video previews', () => {
  const { PORTFOLIO_APP: { createMediaMarkup } } = loadScripts();
  const image = createMediaMarkup({ type: 'image', src: 'assets/images/x.webp', alt: '测试图' });
  assert.match(image, /<img/);
  assert.match(image, /alt="测试图"/);
  assert.match(image, /loading="eager"/);

  const video = createMediaMarkup({ type: 'video', src: 'assets/video/x.mp4', poster: 'assets/images/x.webp', alt: '测试视频' });
  assert.match(video, /<video/);
  assert.match(video, /controls/);
  assert.match(video, /preload="metadata"/);
  assert.match(video, /poster="assets\/images\/x\.webp"/);
});

test('project cards clearly tell visitors that more images are available', () => {
  const { PORTFOLIO_PROJECTS, PORTFOLIO_APP: { createProjectCard, createProjectDetailMarkup } } = loadScripts();
  assert.equal(typeof createProjectCard, 'function');
  assert.equal(typeof createProjectDetailMarkup, 'function');

  const card = createProjectCard(PORTFOLIO_PROJECTS[0], 0);
  assert.match(card, /点击查看完整项目/);
  assert.match(card, /全部图片/);

  const detail = createProjectDetailMarkup(PORTFOLIO_PROJECTS[0]);
  assert.match(detail, /点击任意图片可放大查看/);
});

test('the tenth project uses the right-hand grid slot', () => {
  const { PORTFOLIO_PROJECTS, PORTFOLIO_APP: { createProjectCard } } = loadScripts();
  const card = createProjectCard(PORTFOLIO_PROJECTS[9], 9);
  assert.match(card, /project-card--2/);
});

test('long manual artwork renders as a full-width scrollable detail image', () => {
  const { PORTFOLIO_PROJECTS, PORTFOLIO_APP: { createProjectDetailMarkup } } = loadScripts();
  const project = PORTFOLIO_PROJECTS.find((item) => item.id === 'ruihu-vi-manual');
  const detail = createProjectDetailMarkup(project);
  assert.match(detail, /project-media--long/);
});

test('interaction module supports keyboard closing, focus restoration and future video data', () => {
  const source = readFileSync(resolve(root, 'assets/js/app.js'), 'utf8');
  assert.match(source, /event\.key === ['"]Escape['"]/);
  assert.match(source, /showModal\(\)/);
  assert.match(source, /\.focus\(\)/);
  assert.match(source, /querySelectorAll\(['"]video['"]\)/);
  assert.match(source, /PORTFOLIO_PROJECTS/);
  assert.match(source, /setMenu/);
  assert.match(source, /openMedia/);
  assert.match(source, /closeMedia/);
});

test('resume preview opens in a dedicated scrollable media view', () => {
  const source = readFileSync(resolve(root, 'assets/js/app.js'), 'utf8');
  const css = readFileSync(resolve(root, 'assets/css/styles.css'), 'utf8');
  assert.match(source, /scrollable:\s*true/);
  assert.match(source, /media-dialog--scrollable/);
  assert.match(source, /stage\.scrollTop\s*=\s*0/);
  assert.match(css, /media-dialog--scrollable[\s\S]*overflow-y:\s*auto/);
  assert.match(css, /media-dialog--scrollable[\s\S]*max-height:\s*none/);
});
