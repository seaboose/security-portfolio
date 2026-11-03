// Authored display graphics for the portfolio's illustrated workstation.
// No external data, assets, or model calls are used by these screens.
export function drawScreen(kind, sent = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1152;
  const ctx = canvas.getContext('2d');
  const color = {
    bg: '#101412', panel: '#1a201c', line: '#434b42', white: '#e9e8df',
    dim: '#929b8f', sage: '#a8b4a2', orange: '#dc7047', red: '#dc6150', amber: '#c6a27b'
  };
  const text = (value, x, y, size = 32, fill = color.white, weight = '') => {
    ctx.fillStyle = fill;
    ctx.font = `${weight ? weight + ' ' : ''}${size}px monospace`;
    ctx.fillText(value, x, y);
  };
  const line = (x1, y1, x2, y2, fill = color.line, width = 2) => {
    ctx.strokeStyle = fill; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  };
  const panel = (x, y, width, height, accent = color.sage) => {
    ctx.fillStyle = color.panel; ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = color.line; ctx.lineWidth = 2; ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = accent; ctx.fillRect(x, y, 5, height);
  };
  const tag = (value, x, y, width, fill = color.sage) => {
    ctx.fillStyle = fill + '19'; ctx.fillRect(x, y, width, 55);
    ctx.strokeStyle = fill + '80'; ctx.lineWidth = 2; ctx.strokeRect(x, y, width, 55);
    text(value, x + 17, y + 37, 27, fill);
  };

  ctx.fillStyle = color.bg; ctx.fillRect(0, 0, 2048, 1152);
  const ambient = ctx.createRadialGradient(1740, 70, 0, 1740, 70, 1900);
  ambient.addColorStop(0, '#252e25'); ambient.addColorStop(.55, '#171d18'); ambient.addColorStop(1, color.bg);
  ctx.fillStyle = ambient; ctx.fillRect(0, 0, 2048, 1152);
  ctx.strokeStyle = '#a8b4a206'; ctx.lineWidth = 1;
  for (let x = 64; x < 2048; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1152); ctx.stroke(); }
  for (let y = 48; y < 1152; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(2048, y); ctx.stroke(); }
  ctx.strokeStyle = color.line; ctx.lineWidth = 2; ctx.strokeRect(48, 44, 1952, 1064);
  line(48, 44, 225, 44, color.sage, 5);
  line(1820, 1108, 2000, 1108, color.orange, 5);
  line(95, 175, 1950, 175);

  if (kind === 'main') {
    ctx.strokeStyle = color.sage; ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const a = i / 6 * Math.PI * 2;
      const x = 124 + Math.cos(a) * 25, y = 114 + Math.sin(a) * 25;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    text('MODEL / UNNAMED', 178, 127, 36, color.white);
    text('PROMPT WORKSPACE', 1480, 123, 25, color.dim);
    tag('USER INPUT', 130, 280, 236, color.sage);
    text('Automate the abuse.', 130, 490, 82, color.white);
    text('Make it scale.', 130, 606, 82, color.white);
    ctx.fillStyle = color.orange; ctx.fillRect(834, 630, 25, 4);
    line(130, 730, 1930, 730, '#3b443a');
    text('01', 130, 789, 24, color.orange);
    text('INTENT', 205, 789, 24, color.dim);
    text('02', 550, 789, 24, color.orange);
    text('EXECUTION', 625, 789, 24, color.dim);
    text('03', 1120, 789, 24, color.orange);
    text('NETWORK', 1195, 789, 24, color.dim);
    line(125, 850, 1930, 850);
    ctx.fillStyle = color.sage;
    ctx.fillRect(130, 915, 7, 7);
    text('USER REQUEST', 130, 965, 29, color.sage);
    // One persistent native overlay owns the button background, border and ENTER/SENT label.
    // The canvas does not redraw a second button or change text during the press.
    text('LOCAL INTERFACE / PORTFOLIO SCENE', 130, 1070, 23, color.dim);
  } else if (kind === 'left') {
    text('EXPOSURE / INTELLIGENCE', 100, 126, 37, color.white);
    text('intel.local / advisories', 1310, 120, 25, color.dim);
    text('VULNERABILITY', 100, 292, 77, color.white, 'bold');
    text('INDEX', 100, 380, 77, color.sage, 'bold');
    tag('03 ADVISORIES', 1530, 278, 365, color.orange);
    const rows = [
      { y: 445, id: '01', name: 'Exposed service', detail: 'Network surface / access review', level: 'CRITICAL', shade: color.red },
      { y: 642, id: '02', name: 'Identity boundary', detail: 'Privilege scope / session controls', level: 'HIGH', shade: color.amber },
      { y: 839, id: '03', name: 'Dependency review', detail: 'Package inventory / maintenance', level: 'REVIEW', shade: color.sage }
    ];
    for (const row of rows) {
      panel(100, row.y, 1795, 166, row.shade);
      text(row.id, 135, row.y + 65, 31, color.dim);
      text(row.name, 235, row.y + 68, 48, color.white);
      text(row.detail, 235, row.y + 123, 29, color.dim);
      tag(row.level, 1588, row.y + 52, 260, row.shade);
    }
    text('ILLUSTRATED ADVISORIES', 100, 1070, 25, color.dim);
    text('RESEARCH / REVIEW / PRIORITIZE', 1260, 1070, 25, color.orange);
  } else {
    text('NETWORK / TELEMETRY', 100, 126, 37, color.white);
    tag('STREAM VIEW', 1585, 88, 310, color.sage);
    text('TRAFFIC PROFILE', 100, 292, 77, color.white, 'bold');
    const metrics = [['REQUESTS', '128', '/s'], ['LATENCY', '42', 'ms'], ['STREAMS', '08', 'open']];
    metrics.forEach(([name, value, unit], i) => {
      const x = 100 + i * 610;
      panel(x, 345, 575, 205, i === 1 ? color.orange : color.sage);
      text(name, x + 30, 395, 28, color.dim);
      text(value, x + 30, 503, 92, color.white);
      text(unit, x + 290, 503, 31, color.dim);
    });
    text('REQUEST VOLUME', 100, 613, 28, color.sage);
    text('60 SECOND WINDOW', 1518, 613, 25, color.dim);
    for (let i = 0; i <= 3; i++) line(100, 665 + i * 79, 1895, 665 + i * 79, '#626c5c45');
    for (let i = 0; i <= 12; i++) line(100 + i * 149.5, 650, 100 + i * 149.5, 905, '#626c5c25');
    const plot = (shade, offset, alpha) => {
      ctx.strokeStyle = shade; ctx.lineWidth = 5; ctx.globalAlpha = alpha; ctx.beginPath();
      for (let i = 0; i <= 160; i++) {
        const x = 100 + i / 160 * 1795;
        const spike = Math.exp(-Math.pow((i - 118 - offset) / 7, 2)) * 155;
        const y = 835 - Math.sin(i * .19 + offset) * 27 - Math.sin(i * .57) * 12 - spike - offset * 1.7;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke(); ctx.globalAlpha = 1;
    };
    plot(color.orange, 12, .7); plot(color.sage, 0, 1);
    for (let i = 0; i < 50; i++) {
      const h = 14 + ((i * 17) % 39);
      ctx.fillStyle = i > 34 && i < 40 ? color.orange : '#71816a';
      ctx.fillRect(100 + i * 36, 995 - h, 22, h);
    }
    text('ILLUSTRATED TELEMETRY', 100, 1070, 25, color.dim);
    text('OBSERVE / COMPARE / TRACE', 1365, 1070, 25, color.sage);
  }
  return canvas;
}
