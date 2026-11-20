'use strict';

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const reducedData = Boolean(navigator.connection?.saveData);
let galleryPaused = motionPreference.matches || reducedData;
let methodPaused = galleryPaused;
let resultsPaused = galleryPaused;
document.documentElement.classList.add('js');

function loadVideo(video) {
  if (!video.getAttribute('src') && video.dataset.src) {
    video.src = video.dataset.src;
    video.load();
  }
}
function playVideo(video) {
  loadVideo(video);
  if (video.paused) video.play()?.catch(() => { /* Keep the poster if autoplay is blocked. */ });
}
function setMotionButton(button, paused, label) {
  button.setAttribute('aria-pressed', String(paused));
  button.replaceChildren(document.createTextNode(`${paused ? 'Play' : 'Pause'} ${label} `));
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = paused ? '▶' : 'Ⅱ';
  button.append(icon);
}

const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
  mobileNav.hidden = true;
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  mobileNav.hidden = !open;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuToggle.focus(); }
});
window.matchMedia('(min-width: 601px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

function keyboardTabs(tabs, activate) {
  tabs.forEach((tab, index) => tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    tabs[next].focus();
    activate(next);
  }));
}

const galleryVideos = [...document.querySelectorAll('.demo-card video')];
const resultVideos = [...document.querySelectorAll('.contact-result video')];
const methodVideo = document.querySelector('#method-video');
const featureVideos = [...document.querySelectorAll('#supplement-video, #teaser-video, #parallel-video')];
const galleryMotion = document.querySelector('#gallery-motion');
const resultsMotion = document.querySelector('#results-motion');
const methodMotion = document.querySelector('#method-motion');
const visibleVideos = new Set();
const dialog = document.querySelector('#demo-dialog');
const dialogVideo = document.querySelector('#dialog-video');

const steps = [
  { title: 'Ground the instruction.', description: 'Read the task. Measure the scene.', agent: 'Inspect scene', badge: 'Build', feedback: 'Simulator measurements ground the task', preview: 'Inspect the scene' },
  { title: 'Specialists write the expert.', description: 'Five agents. One connected planning program.', agent: 'Coordinate', badge: 'PDDL + Python', feedback: 'Retrieve verified components. Write what is new.', preview: 'Compose the program' },
  { title: 'Execution drives improvement.', description: 'Test in simulation. Diagnose. Repair. Validate.', agent: 'Test & repair', badge: 'Validate', feedback: 'Execution feedback → diagnosis → targeted repairs', preview: 'Test, repair, repeat' },
  { title: 'Freeze once. Generate many.', description: 'One frozen program, many scenes. No further coding-model calls.', agent: 'Authoring done', badge: 'Frozen ✓', feedback: 'Validated program → parallel demonstrations', preview: 'Generate in parallel' }
];
const stepTabs = [...document.querySelectorAll('[data-step]')];
const explorer = document.querySelector('#method-explorer');
const progressFill = document.querySelector('#workflow-progress-fill');
let currentStep = 0;
let methodVisible = false;
let stageElapsed = 0;
let animationFrame = 0;
let lastFrameTime = null;
const stageDuration = 5500;

function selectStep(index, manual = false) {
  currentStep = index;
  stageElapsed = 0;
  const step = steps[index];
  stepTabs.forEach((tab, i) => {
    tab.classList.toggle('active', i === index);
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
  });
  explorer.dataset.stage = String(index);
  document.querySelector('#method-panel').setAttribute('aria-labelledby', `step-tab-${index}`);
  document.querySelector('#step-title').textContent = step.title;
  document.querySelector('#step-description').textContent = step.description;
  document.querySelector('#step-counter').textContent = `0${index + 1} / 04`;
  document.querySelector('#agent-status').textContent = step.agent;
  document.querySelector('#program-badge').textContent = step.badge;
  document.querySelector('#feedback-label').textContent = step.feedback;
  document.querySelector('#preview-label').textContent = step.preview;
  const source = index === 3 ? 'method-drawer-grid' : 'method-drawer';
  const path = `assets/${source}.mp4`;
  if (methodVideo.dataset.src !== path) {
    methodVideo.pause();
    methodVideo.removeAttribute('src');
    methodVideo.dataset.src = path;
    methodVideo.poster = `assets/${source}-poster.webp`;
    methodVideo.load();
  }
  // Manual selection pauses the tour, keeping the selected step available to inspect.
  if (manual) methodPaused = true;
  progressFill.style.transform = `scaleX(${index / steps.length})`;
  refreshMotion();
}
stepTabs.forEach((tab, index) => tab.addEventListener('click', () => selectStep(index, true)));
keyboardTabs(stepTabs, index => selectStep(index, true));

function foregroundIsPlaying() {
  return featureVideos.some(video => !video.paused && !video.ended);
}
function motionAllowed() {
  return !document.hidden && !dialog.open && !foregroundIsPlaying();
}
function runMethodFrame(timestamp) {
  animationFrame = 0;
  if (lastFrameTime !== null) stageElapsed += Math.min(timestamp - lastFrameTime, 100);
  lastFrameTime = timestamp;
  if (stageElapsed >= stageDuration) selectStep((currentStep + 1) % steps.length);
  progressFill.style.transform = `scaleX(${(currentStep + stageElapsed / stageDuration) / steps.length})`;
  if (!animationFrame && !methodPaused && methodVisible && motionAllowed()) {
    animationFrame = requestAnimationFrame(runMethodFrame);
  }
}
function syncMethodAnimation() {
  const running = !methodPaused && methodVisible && motionAllowed();
  explorer.classList.toggle('is-running', running);
  if (running && !animationFrame) {
    lastFrameTime = null;
    animationFrame = requestAnimationFrame(runMethodFrame);
  } else if (!running) {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastFrameTime = null;
  }
  setMotionButton(methodMotion, methodPaused, 'animation');
}
function refreshMotion() {
  const allowed = motionAllowed();
  galleryVideos.forEach(video => {
    if (allowed && !galleryPaused && visibleVideos.has(video) && !video.closest('.demo-card').hidden) playVideo(video);
    else video.pause();
  });
  resultVideos.forEach(video => {
    if (allowed && !resultsPaused && visibleVideos.has(video) && !video.closest('[role="tabpanel"]').hidden) playVideo(video);
    else video.pause();
  });
  if (allowed && !methodPaused && methodVisible && visibleVideos.has(methodVideo)) playVideo(methodVideo);
  else methodVideo.pause();
  setMotionButton(galleryMotion, galleryPaused, 'previews');
  setMotionButton(resultsMotion, resultsPaused, 'result previews');
  syncMethodAnimation();
}
galleryMotion.addEventListener('click', () => { galleryPaused = !galleryPaused; refreshMotion(); });
resultsMotion.addEventListener('click', () => { resultsPaused = !resultsPaused; refreshMotion(); });
methodMotion.addEventListener('click', () => { methodPaused = !methodPaused; refreshMotion(); });

const videoObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) visibleVideos.add(entry.target);
    else visibleVideos.delete(entry.target);
  });
  refreshMotion();
}, { threshold: 0.15 });
[methodVideo, ...galleryVideos, ...resultVideos].forEach(video => videoObserver.observe(video));
const methodObserver = new IntersectionObserver(entries => {
  methodVisible = entries[0].isIntersecting;
  refreshMotion();
}, { threshold: 0.2 });
methodObserver.observe(explorer);

// User-controlled videos use real HTML sources and remain independent of scroll observers.
document.querySelectorAll('.supplement-section').forEach(section => {
  const filmVideo = section.querySelector('.feature-video');
  const filmPlay = section.querySelector('.film-play');
  const filmError = section.querySelector('.film-error');
  filmPlay.hidden = false;
  filmPlay.addEventListener('click', () => {
    filmError.hidden = true;
    filmVideo.play().catch(error => {
      if (error.name !== 'AbortError') filmError.hidden = false;
    });
  });
  filmVideo.addEventListener('play', () => { filmPlay.hidden = true; filmError.hidden = true; });
  filmVideo.addEventListener('pause', () => { filmPlay.hidden = false; });
  filmVideo.addEventListener('ended', () => { filmPlay.hidden = false; });
  filmVideo.addEventListener('error', () => { filmError.hidden = false; });
  // A server without byte-range support leaves the video unseekable in Chrome, so the progress bar
  // ignores clicks. Then the file is fetched whole and played from memory, which can always seek.
  let wholeFile = null;
  const ensureSeekable = () => {
    if (wholeFile || !Number.isFinite(filmVideo.duration)) return;
    const s = filmVideo.seekable;
    if (s.length && s.end(s.length - 1) >= filmVideo.duration - 0.5) return;
    const at = filmVideo.currentTime, playing = !filmVideo.paused;
    wholeFile = fetch(filmVideo.currentSrc || filmVideo.src)
      .then(response => { if (!response.ok) throw new Error(response.status); return response.blob(); })
      .then(blob => {
        filmVideo.src = URL.createObjectURL(blob);
        filmVideo.addEventListener('loadedmetadata', () => {
          filmVideo.currentTime = at;
          if (playing) filmVideo.play().catch(() => {});
        }, { once: true });
      })
      .catch(() => {});
  };
  // Checked on first use only, so a page on such a server does not download every film up front.
  filmVideo.addEventListener('play', ensureSeekable);
  filmVideo.addEventListener('pointerdown', ensureSeekable);
});
featureVideos.forEach(video => {
  video.addEventListener('play', () => {
    featureVideos.forEach(other => { if (other !== video) other.pause(); });
    refreshMotion();
  });
  video.addEventListener('pause', refreshMotion);
  video.addEventListener('ended', refreshMotion);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    dialogVideo.pause();
  }
  refreshMotion();
});
motionPreference.addEventListener('change', event => {
  if (event.matches) {
    galleryPaused = methodPaused = resultsPaused = true;
    finishCounts();
    refreshMotion();
  }
});

const resultTabs = [...document.querySelectorAll('[data-result]')];
function selectResult(index) {
  resultTabs.forEach((tab, i) => {
    tab.classList.toggle('active', i === index);
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
    document.querySelector(`#result-${tab.dataset.result}`).hidden = i !== index;
  });
  refreshMotion();
}
resultTabs.forEach((tab, index) => tab.addEventListener('click', () => selectResult(index)));
keyboardTabs(resultTabs, selectResult);

const filters = [...document.querySelectorAll('[data-filter]')];
filters.forEach(filter => filter.addEventListener('click', () => {
  filters.forEach(button => {
    button.classList.toggle('active', button === filter);
    button.setAttribute('aria-pressed', String(button === filter));
  });
  let count = 0;
  document.querySelectorAll('.demo-card').forEach(card => {
    card.hidden = filter.dataset.filter !== 'all' && filter.dataset.filter !== card.dataset.category;
    if (!card.hidden) count++;
  });
  document.querySelector('#gallery-count').textContent = `${count} demonstrations`;
  refreshMotion();
}));

let dialogTrigger = null;
document.querySelectorAll('.demo-open').forEach(button => button.addEventListener('click', () => {
  dialogTrigger = button;
  document.querySelector('#dialog-title').textContent = button.dataset.title;
  document.querySelector('#dialog-caption').textContent = button.dataset.caption;
  dialogVideo.src = `assets/${button.dataset.video}.mp4`;
  dialogVideo.poster = `assets/${button.dataset.video}-poster.webp`;
  dialog.showModal();
  document.body.classList.add('modal-open');
  featureVideos.forEach(video => video.pause());
  refreshMotion();
  dialogVideo.play()?.catch(() => {});
}));
document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  dialogVideo.pause();
  dialogVideo.removeAttribute('src');
  dialogVideo.load();
  document.body.classList.remove('modal-open');
  refreshMotion();
  dialogTrigger?.focus();
});

// Final manuscript values are present in HTML; reveal each chart only once.
const activeCounts = new Map();
const formatCount = element => Number(element.dataset.count).toLocaleString('en-US', {
  minimumFractionDigits: Number(element.dataset.decimals || 0),
  maximumFractionDigits: Number(element.dataset.decimals || 0)
});
function finishCounts() {
  activeCounts.forEach((frame, element) => {
    cancelAnimationFrame(frame);
    element.textContent = formatCount(element);
  });
  activeCounts.clear();
}
function animateCount(element) {
  const finalValue = Number(element.dataset.count);
  const decimals = Number(element.dataset.decimals || 0);
  const accessibleValue = document.createElement('span');
  accessibleValue.className = 'sr-only';
  accessibleValue.textContent = formatCount(element);
  element.before(accessibleValue);
  element.setAttribute('aria-hidden', 'true');
  if (motionPreference.matches) return;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / 1250, 1);
    const value = finalValue * (1 - (1 - progress) ** 3);
    element.textContent = value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    if (progress < 1) activeCounts.set(element, requestAnimationFrame(tick));
    else { element.textContent = formatCount(element); activeCounts.delete(element); }
  }
  activeCounts.set(element, requestAnimationFrame(tick));
}
const resultObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('revealed');
    if (entry.target.hasAttribute('data-count')) animateCount(entry.target);
    resultObserver.unobserve(entry.target);
  });
}, { threshold: 0.2 });
document.querySelectorAll('[data-count], .bar-chart, .trial-grid, .reuse-trials').forEach(element => resultObserver.observe(element));

const navLinks = [...document.querySelectorAll('.desktop-nav a')];
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => {
      if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-15% 0px -60% 0px' });
navLinks.forEach(link => sectionObserver.observe(document.querySelector(link.hash)));
refreshMotion();
