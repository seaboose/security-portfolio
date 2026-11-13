let surgeFrames = [
  ['Set up a controlled round', 'Survive is a top-down skillshot-dodging game for comparing human, scripted, and mixed movement trials.', 'play'],
  ['Record the activity', 'Capture gameplay observations with their source identity for later review.', 'record'],
  ['Inspect a finding', 'Compare rule allowances, source records, and synchronized replay for human review.', 'review'],
  ['Explain the evidence', 'Link selected observations to an investigation and its report revisions.', 'explain'],
  ['Export the report', 'Export a reviewable investigation with evidence references and consistency checks.', 'export']
];
fetch('./project-catalog.json?v=e84e83eaf3e4')
  .then(response => response.ok ? response.json() : null)
  .then(catalog => {
    const project = catalog?.projects.find(item => item.id === 'surge');
    if (!project) return;
    surgeFrames = project.steps.map((step, index) => {
      const description = step.visual.screenshotAlt || step.visual.alt || step.copy;
      return [surgeFrames[index]?.[0] || step.label, description, step.visual.screenshot];
    });
  }).catch(() => {});
document.querySelectorAll('[data-walkthrough="surge"]').forEach(demo => {
  const buttons = [...demo.querySelectorAll('[data-step]')];
  function setStep(index) {
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    const frame = surgeFrames[index];
    demo.querySelector('[data-step-title]').textContent = frame[0];
    demo.querySelector('[data-step-copy]').textContent = frame[1];
    const image = demo.querySelector('[data-step-image]');
    const release = document.querySelector('meta[name="portfolio-release"]')?.content;
    const fallback = `assets/project-surge-${frame[2]}.png${release ? '?v=' + release : ''}`;
    image.src = frame[2].includes('/') ? frame[2] : fallback;
    image.alt = frame[1];
  }
  buttons.forEach((button, index) => button.addEventListener('click', () => setStep(index)));
});

const caseTabs = [...document.querySelectorAll('.case-content-tabs [role="tab"]')];
function selectCaseTab(tab, focus = false, updateHash = true) {
  caseTabs.forEach(item => {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
  });
  if (focus) tab.focus({ preventScroll: true });
  if (updateHash) history.replaceState(null, '', `#${tab.getAttribute('aria-controls')}`);
}
caseTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectCaseTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % caseTabs.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + caseTabs.length) % caseTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = caseTabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectCaseTab(caseTabs[next], true); }
  });
});
function routeCaseTab() {
  if (!caseTabs.length) return;
  const wanted = location.hash === '#info' ? 'info-tab' : 'overview-tab';
  selectCaseTab(document.getElementById(wanted), false, false);
}
routeCaseTab();
addEventListener('hashchange', routeCaseTab);
