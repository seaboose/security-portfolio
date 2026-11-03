let surgeFrames = [
  ['Set up a controlled round', 'Survive is a top-down skillshot-dodging game for comparing human, scripted, and mixed movement trials.', 'play'],
  ['Record the activity', 'Capture gameplay observations with their source identity for later review.', 'record'],
  ['Inspect a finding', 'Compare rule allowances, source records, and synchronized replay for human review.', 'review'],
  ['Explain the evidence', 'Link selected observations to an investigation and its report revisions.', 'explain'],
  ['Export the report', 'Export a reviewable investigation with evidence references and consistency checks.', 'export']
];
fetch('./project-catalog.json').then(r=>r.ok?r.json():null).then(catalog=>{const project=catalog?.projects?.find(item=>item.id==='surge');if(project)surgeFrames=project.steps.map(step=>[step.heading.join(' '),step.copy,step.visual.screenshot]);}).catch(()=>{});
const studyFrames = [
  ['Draft from selected material', 'Selected excerpts inform a draft that stays separate from saved material.', 'DRAFT / REVIEW PENDING', 'Selected source text informs a local-model draft.'],
  ['Check sources and structure', 'Compare quotations and answer structure with the source material.', 'SOURCE CHECK / INSPECT EVIDENCE', 'Compare the draft with its source passage.'],
  ['Review the draft', 'Request another model review before presenting the draft for approval.', 'MODEL REVIEW / FEEDBACK', 'Model review provides feedback on the draft.'],
  ['Bound the revision', 'Allow at most one revision, then present the result for human review.', 'REVISION BUDGET / AT MOST ONE', 'One revision keeps the generation workflow bounded.'],
  ['Keep the decision human', 'Require human approval before replacing saved material.', 'HUMAN APPROVAL / REQUIRED', 'Review the evidence, then decide whether to save.']
];

document.querySelectorAll('[data-walkthrough]').forEach(demo => {
  const buttons = [...demo.querySelectorAll('[data-step]')];
  const type = demo.dataset.walkthrough;
  function setStep(index) {
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    const frames = type === 'surge' ? surgeFrames : studyFrames;
    const frame = frames[index];
    demo.querySelector('[data-step-title]').textContent = frame[0];
    demo.querySelector('[data-step-copy]').textContent = frame[1];
    if (type === 'surge') {
      const image = demo.querySelector('[data-step-image]');
      image.src = frame[2].includes('/')?frame[2]:`assets/project-surge-${frame[2]}.png`;
      image.alt = `${frame[0]} — captured Surge desktop interface`;
    } else {
      demo.querySelector('[data-study-state]').textContent = frame[2];
      demo.querySelector('[data-study-result]').textContent = frame[3];
    }
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
