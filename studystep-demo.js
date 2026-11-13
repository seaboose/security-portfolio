// Show the desktop capture for this step. Where two states were recorded,
// dissolve from the first action to its result. The screenshot button opens the result at full size.
export function mountStudyStepDemo(container, step) {
  const { visual } = step;
  const root = document.createElement('div');
  root.className = 'studystep-capture';
  root.dataset.scene = visual.scene;
  root.dataset.paused = 'true';
  root.setAttribute('role', 'img');
  root.setAttribute('aria-label', step.copy);

  const result = new Image();
  result.alt = '';
  result.src = visual.screenshot;
  result.className = 'studystep-result';
  root.append(result);

  if (visual.before) {
    const before = new Image();
    before.alt = '';
    before.className = 'studystep-before';
    // Leave the result visible if a preceding frame is absent or slow to load.
    before.onload = () => { root.classList.add('has-before'); };
    before.src = visual.before.screenshot;
    root.prepend(before);
  }

  container.replaceChildren(root);
  return {
    pause(paused = true) {
      root.dataset.paused = String(paused);
    },
    dispose() {
      root.remove();
    }
  };
}
