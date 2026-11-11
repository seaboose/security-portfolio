// The Act walkthrough shares its pause, visibility and screenshot controls across scenes.
export function mountSurgeDemo(container, step) {
  const {video: clip, screenshot, alt} = step.visual;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const frame = document.createElement('div');
  frame.className = 'surge-recording';

  const still = new Image();
  still.src = screenshot;
  still.alt = alt;
  frame.append(still);
  container.append(frame);

  let video = null;
  let failed = false;

  function showStill() {
    if (!video) return;
    const previous = video;
    video = null;
    previous.pause();
    previous.removeAttribute('src');
    previous.load();
    frame.replaceChildren(still);
  }

  function startClip() {
    const player = document.createElement('video');
    player.muted = true;
    player.playsInline = true;
    player.loop = true;
    player.poster = screenshot;
    player.setAttribute('aria-label', step.copy);
    player.addEventListener('error', () => {
      if (video !== player) return;
      failed = true;
      showStill();
    }, {once: true});
    player.src = clip;
    frame.replaceChildren(player);
    video = player;
  }

  return {
    pause(paused = true) {
      if (reduced.matches) {
        showStill();
      } else if (paused) {
        video?.pause();
      } else if (!failed) {
        if (!video) startClip();
        const current = video;
        current.play().catch(error => {
          // A quick step change or pause can cancel a pending play request.
          if (current === video && error.name !== 'AbortError') showStill();
        });
      }
    },
    dispose() {
      showStill();
      frame.remove();
    }
  };
}
