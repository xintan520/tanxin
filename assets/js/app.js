const PORTFOLIO_PROJECTS = globalThis.PORTFOLIO_PROJECTS || [];
const FILTERS = globalThis.FILTERS || [];
const VIDEO_SHOWCASE = globalThis.VIDEO_SHOWCASE || [];
const EXTRA_VIDEO_LINKS = globalThis.EXTRA_VIDEO_LINKS || [];

let activeFilter = 'all';
let lastFocusedElement = null;

const escapeHTML = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function filterProjects(projects, filter) {
  return filter === 'all' ? [...projects] : projects.filter((project) => project.category === filter);
}

function createMediaMarkup(item) {
  const src = escapeHTML(item.src);
  const alt = escapeHTML(item.alt || '作品预览');
  if (item.type === 'video') {
    const poster = escapeHTML(item.poster || '');
    return `<video controls playsinline preload="metadata" poster="${poster}" aria-label="${alt}"><source src="${src}" type="video/mp4">当前浏览器不支持视频播放。</video>`;
  }
  return `<img src="${src}" alt="${alt}" loading="eager">`;
}

function mediaButton(item, className = 'project-media') {
  const preview = item.type === 'video' ? item.poster : item.src;
  const badge = item.type === 'video' ? '<span class="play-badge" aria-hidden="true">▶</span>' : '';
  const layoutClass = item.layout === 'long' ? ' project-media--long' : '';
  return `<button class="${className}${layoutClass}" type="button" data-media='${escapeHTML(JSON.stringify(item))}' aria-label="打开${escapeHTML(item.alt)}">
    <img src="${escapeHTML(preview)}" alt="${escapeHTML(item.alt)}" loading="lazy">${badge}
  </button>`;
}

function createProjectCard(project, index) {
  return `<article class="project-card project-card--${(index % 4) + 1}" data-reveal>
    <button class="project-card__button" type="button" data-project-id="${project.id}" aria-label="查看${escapeHTML(project.title)}项目">
      <span class="project-card__image"><img src="${project.cover}" alt="${escapeHTML(project.title)}：${escapeHTML(project.subtitle)}" loading="lazy"></span>
      <span class="project-card__meta">
        <span><strong>${escapeHTML(project.title)}</strong><small>${escapeHTML(project.subtitle)}</small></span>
        <span class="project-card__year">${escapeHTML(project.year)}</span>
      </span>
      <span class="project-card__cta"><span>点击查看完整项目</span><span>全部图片 ↗</span></span>
    </button>
  </article>`;
}

function createProjectDetailMarkup(project) {
  return `<header class="project-detail__header">
      <p>${escapeHTML(project.year)} · ${escapeHTML(project.subtitle)}</p>
      <h2 id="project-dialog-title">${escapeHTML(project.title)}</h2>
      <div class="project-detail__intro">
        <p>${escapeHTML(project.description)}</p>
        <p class="project-detail__hint">点击任意图片可放大查看</p>
      </div>
    </header>
    <div class="project-detail__media">${project.media.map((item) => mediaButton(item)).join('')}</div>`;
}

function bindMediaButtons(scope = document) {
  scope.querySelectorAll('[data-media]').forEach((button) => {
    button.addEventListener('click', () => openMedia(JSON.parse(button.dataset.media)));
  });
}

function bindProjectButtons() {
  document.querySelectorAll('[data-project-id]').forEach((button) => {
    button.addEventListener('click', () => openProject(button.dataset.projectId));
  });
}

function observeReveals() {
  const items = document.querySelectorAll('[data-reveal]:not(.is-observed)');
  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible', 'is-observed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach((item) => observer.observe(item));
}

function renderProjects(filter = activeFilter) {
  activeFilter = filter;
  const grid = document.querySelector('[data-project-grid]');
  if (!grid) return;
  const projects = filterProjects(PORTFOLIO_PROJECTS, filter);
  grid.innerHTML = projects.map(createProjectCard).join('');
  document.querySelectorAll('[data-filter]').forEach((button) => {
    const selected = button.dataset.filter === filter;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  bindProjectButtons();
  observeReveals();
}

function renderFilters() {
  const container = document.querySelector('[data-filters]');
  if (!container) return;
  container.innerHTML = FILTERS.map(([value, label], index) => `<button type="button" data-filter="${value}" aria-pressed="${index === 0}">${label}</button>`).join('');
  container.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (button) renderProjects(button.dataset.filter);
  });
}

function openProject(projectId) {
  const project = PORTFOLIO_PROJECTS.find((item) => item.id === projectId);
  const dialog = document.querySelector('[data-project-dialog]');
  const content = document.querySelector('[data-project-dialog-content]');
  if (!project || !dialog || !content) return;
  lastFocusedElement = document.activeElement;
  content.innerHTML = createProjectDetailMarkup(project);
  bindMediaButtons(content);
  dialog.showModal();
  document.body.classList.add('is-dialog-open');
}

function openMedia(item) {
  const dialog = document.querySelector('[data-media-dialog]');
  const stage = document.querySelector('[data-media-stage]');
  if (!dialog || !stage) return;
  lastFocusedElement = document.activeElement;
  dialog.classList.toggle('media-dialog--scrollable', Boolean(item.scrollable));
  stage.innerHTML = createMediaMarkup(item);
  stage.scrollTop = 0;
  dialog.showModal();
  document.body.classList.add('is-dialog-open');
}

function closeMedia(dialog = document.querySelector('[data-media-dialog]')) {
  if (!dialog) return;
  dialog.querySelectorAll('video').forEach((video) => video.pause());
  if (dialog.open) dialog.close();
  const stage = dialog.querySelector('[data-media-stage]');
  if (stage) stage.innerHTML = '';
  if (!document.querySelector('dialog[open]')) document.body.classList.remove('is-dialog-open');
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
}

function closeProject() {
  const dialog = document.querySelector('[data-project-dialog]');
  if (!dialog) return;
  dialog.querySelectorAll('video').forEach((video) => video.pause());
  if (dialog.open) dialog.close();
  document.body.classList.remove('is-dialog-open');
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
}

function setMenu(open) {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  if (!toggle || !nav) return;
  toggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
  document.body.classList.toggle('is-menu-open', open);
}

function renderMotion() {
  const container = document.querySelector('[data-motion-grid]');
  const project = PORTFOLIO_PROJECTS.find((item) => item.id === 'motion-practice');
  if (!container || !project) return;
  container.innerHTML = project.media.filter((item) => item.type === 'video').map((item, index) => `
    <div class="motion-card" data-reveal>
      ${mediaButton(item, 'motion-card__button')}
      <div class="motion-card__meta"><span>0${index + 1}</span><span>${escapeHTML(item.alt)}</span><span>点击播放</span></div>
    </div>`).join('');
  bindMediaButtons(container);
}

function renderVideoShowcase() {
  const container = document.querySelector('[data-video-showcase-grid]');
  const extras = document.querySelector('[data-extra-video-links]');
  if (container) {
    container.innerHTML = VIDEO_SHOWCASE.map((item, index) => `
      <article class="linked-video-card" data-reveal>
        <a class="linked-video-card__image" href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="观看${escapeHTML(item.title)}完整视频">
          <img src="${escapeHTML(item.poster)}" alt="${escapeHTML(item.alt)}" loading="lazy">
          <span class="linked-video-card__badge">${escapeHTML(item.label)}</span>
          <span class="linked-video-card__play" aria-hidden="true">↗</span>
        </a>
        <div class="linked-video-card__meta">
          <span>0${index + 1}</span>
          <strong>${escapeHTML(item.title)}</strong>
          <a href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer">点击观看完整视频 ↗</a>
        </div>
      </article>`).join('');
  }
  if (extras) {
    extras.innerHTML = EXTRA_VIDEO_LINKS.map((item) => `<a href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.title)} <span aria-hidden="true">↗</span></a>`).join('');
  }
}

function bindDialogs() {
  const projectDialog = document.querySelector('[data-project-dialog]');
  const mediaDialog = document.querySelector('[data-media-dialog]');
  document.querySelector('[data-close-dialog]')?.addEventListener('click', closeProject);
  document.querySelector('[data-close-media]')?.addEventListener('click', () => closeMedia());
  [projectDialog, mediaDialog].forEach((dialog) => {
    dialog?.addEventListener('click', (event) => {
      if (event.target === dialog) dialog === mediaDialog ? closeMedia(dialog) : closeProject();
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (mediaDialog?.open) closeMedia(mediaDialog);
      else if (projectDialog?.open) closeProject();
    }
  });
}

function init() {
  renderFilters();
  renderProjects();
  renderMotion();
  renderVideoShowcase();
  bindDialogs();
  bindMediaButtons();
  document.querySelector('.menu-toggle')?.addEventListener('click', (event) => {
    setMenu(event.currentTarget.getAttribute('aria-expanded') !== 'true');
  });
  document.querySelectorAll('.site-nav a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.querySelector('[data-preview-src]')?.addEventListener('click', (event) => openMedia({
    type: 'image', src: event.currentTarget.dataset.previewSrc, alt: event.currentTarget.dataset.previewAlt, scrollable: true,
  }));
  observeReveals();
}

globalThis.PORTFOLIO_APP = {
  filterProjects,
  createMediaMarkup,
  createProjectCard,
  createProjectDetailMarkup,
  renderProjects,
  openMedia,
  closeMedia,
  setMenu,
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}
