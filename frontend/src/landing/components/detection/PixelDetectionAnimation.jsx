import { useEffect, useRef } from 'react';

const COLS = 48;
const ROWS = 32;
const GAP = 1;

const PHASE_FILL = 2.0;

const CYCLE_FIRE = 1.2;
const CYCLE_BOX = 0.8;
const CYCLE_LABEL = 0.6;
const CYCLE_HOLD = 2.0;
const CYCLE_FADE = 0.8;
const CYCLE_TOTAL = CYCLE_FIRE + CYCLE_BOX + CYCLE_LABEL + CYCLE_HOLD + CYCLE_FADE;

const STILL_ELAPSED = PHASE_FILL + CYCLE_FIRE + CYCLE_BOX + CYCLE_LABEL + 0.5;

const NEUTRALS = ['#e8e6dc', '#dedcd1', '#d1cfc5', '#e3e1d7', '#c2c0b6', '#ebe9e0', '#f0eee6', '#d6d4ca', '#c9c7bd', '#dad8ce'];
const BOX_STROKE = '#141413';
const FIRE_COLORS = [
  '#d97757', '#e58a5c', '#eda15f', '#f2b866', '#f4cd7a',
  '#c96442', '#b94f36', '#e07055', '#cf6b52', '#c46686',
  '#e9925f', '#f0c26e', '#d55f3f', '#a8432c', '#e4a35c',
];
const ACCENT = '#d97757';

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

const clamp01 = (value) => Math.min(1, Math.max(0, value));

function buildBackground(palette) {
  const orderRng = seededRandom(42);
  const cells = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      cells.push({ col, row, order: orderRng() });
    }
  }
  cells.sort((a, b) => a.order - b.order);

  const colorRng = seededRandom(123);
  return cells.map(({ col, row }) => ({ col, row, color: pick(palette, colorRng) }));
}

function buildCycle(index) {
  const posRng = seededRandom(42 + index * 13);
  const fw = 8 + Math.floor(posRng() * 6);
  const fh = 9 + Math.floor(posRng() * 6);
  const minCol = 4 + Math.floor(posRng() * (COLS - fw - 8));
  const minRow = 4 + Math.floor(posRng() * (ROWS - fh - 8));
  const maxCol = minCol + fw;
  const maxRow = minRow + fh;
  const shapeType = Math.floor(posRng() * 2);
  const confidence = 85 + Math.floor(posRng() * 14);

  const sortRng = seededRandom(777 + index);
  const colorRng = seededRandom(999 + index);
  const cells = [];

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      let isFire = true;

      if (shapeType === 0) {
        const relX = (col - minCol) / fw;
        const relY = (row - minRow) / fh;
        const allowedWidth = 0.2 + 0.8 * Math.pow(relY, 1.5);
        if (Math.abs(relX - 0.5) * 2 > allowedWidth) isFire = false;
        if (sortRng() > 0.85) isFire = !isFire;
      } else if (sortRng() > 0.8) {
        isFire = false;
      }

      if (isFire) cells.push({ col, row, order: sortRng() });
    }
  }

  cells.sort((a, b) => a.order - b.order);
  for (const cell of cells) cell.color = pick(FIRE_COLORS, colorRng);

  const bounds = cells.length
    ? cells.reduce(
        (box, { col, row }) => ({
          minCol: Math.min(box.minCol, col),
          maxCol: Math.max(box.maxCol, col),
          minRow: Math.min(box.minRow, row),
          maxRow: Math.max(box.maxRow, row),
        }),
        { minCol: maxCol, maxCol: minCol, minRow: maxRow, maxRow: minRow }
      )
    : { minCol, maxCol, minRow, maxRow };

  return { cells, bounds, confidence };
}

function phaseAt(elapsed) {
  if (elapsed < PHASE_FILL) return { phase: 'calibrating', cycle: -1 };
  const t = elapsed - PHASE_FILL;
  const cycle = Math.floor(t / CYCLE_TOTAL);
  const time = t % CYCLE_TOTAL;
  if (time < CYCLE_FIRE + CYCLE_BOX) return { phase: 'scanning', cycle };
  if (time < CYCLE_TOTAL - CYCLE_FADE) return { phase: 'locked', cycle };
  return { phase: 'clearing', cycle };
}

function traceBoxOutline(ctx, x, y, w, h, progress) {
  let remaining = 2 * (w + h) * progress;
  ctx.beginPath();
  ctx.moveTo(x, y);

  const top = Math.min(remaining, w);
  ctx.lineTo(x + top, y);
  remaining -= top;

  if (remaining > 0) {
    const right = Math.min(remaining, h);
    ctx.lineTo(x + w, y + right);
    remaining -= right;
  }
  if (remaining > 0) {
    const bottom = Math.min(remaining, w);
    ctx.lineTo(x + w - bottom, y + h);
    remaining -= bottom;
  }
  if (remaining > 0) {
    const left = Math.min(remaining, h);
    ctx.lineTo(x, y + h - left);
  }
  ctx.stroke();
}

function drawCorners(ctx, x, y, w, h) {
  const arm = Math.min(12, w * 0.15);
  const corners = [
    [x, y + arm, x, y, x + arm, y],
    [x + w - arm, y, x + w, y, x + w, y + arm],
    [x + w, y + h - arm, x + w, y + h, x + w - arm, y + h],
    [x + arm, y + h, x, y + h, x, y + h - arm],
  ];
  for (const [x1, y1, x2, y2, x3, y3] of corners) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();
  }
}

export default function PixelDetectionAnimation({ className, onPhaseChange }) {
  const canvasRef = useRef(null);
  const onPhaseRef = useRef(onPhaseChange);

  useEffect(() => {
    onPhaseRef.current = onPhaseChange;
  }, [onPhaseChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const monoFamily = getComputedStyle(canvas).getPropertyValue('--font-mono').trim() || 'ui-monospace';
    const labelFont = `600 11px ${monoFamily}, ui-monospace, monospace`;

    const background = buildBackground(NEUTRALS);
    const cycles = new Map();
    const getCycle = (index) => {
      if (!cycles.has(index)) {
        cycles.set(index, buildCycle(index));
        if (cycles.size > 4) cycles.delete(cycles.keys().next().value);
      }
      return cycles.get(index);
    };

    let width = 0;
    let height = 0;
    let dpr = 1;
    let backgroundCache = null;
    let elapsed = 0;
    let lastNow = 0;
    let raf = 0;
    let visible = false;
    let lastPhaseKey = '';

    const geometry = () => {
      const cellW = (width - GAP * (COLS + 1)) / COLS;
      const cellH = (height - GAP * (ROWS + 1)) / ROWS;
      const cellSize = Math.max(1, Math.min(cellW, cellH));
      const gridW = COLS * (cellSize + GAP) + GAP;
      const gridH = ROWS * (cellSize + GAP) + GAP;
      const offsetX = (width - gridW) / 2;
      const offsetY = (height - gridH) / 2;
      return {
        cellSize,
        x: (col) => offsetX + GAP + col * (cellSize + GAP),
        y: (row) => offsetY + GAP + row * (cellSize + GAP),
      };
    };

    const drawBackground = (target, fillProgress, grid) => {
      const total = background.length;
      for (let i = 0; i < total; i++) {
        const threshold = i / total;
        if (fillProgress <= threshold) break;
        const localT = (fillProgress - threshold) / (1 - threshold + 0.001);
        target.globalAlpha = Math.min(1, localT * 2);
        target.fillStyle = background[i].color;
        target.fillRect(grid.x(background[i].col), grid.y(background[i].row), grid.cellSize, grid.cellSize);
      }
      target.globalAlpha = 1;
    };

    const cachedBackground = (grid) => {
      if (backgroundCache) return backgroundCache;
      const offscreen = document.createElement('canvas');
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const offCtx = offscreen.getContext('2d');
      offCtx.scale(dpr, dpr);
      drawBackground(offCtx, 1, grid);
      backgroundCache = offscreen;
      return offscreen;
    };

    const reportPhase = (time) => {
      const { phase, cycle } = phaseAt(time);
      const key = `${phase}:${cycle}`;
      if (key === lastPhaseKey) return;
      lastPhaseKey = key;
      onPhaseRef.current?.({ phase, cycle, confidence: cycle >= 0 ? getCycle(cycle).confidence : null });
    };

    const draw = (time, now) => {
      if (!width || !height) return;
      const grid = geometry();

      ctx.clearRect(0, 0, width, height);

      const fillProgress = Math.min(1, time / PHASE_FILL);
      if (fillProgress < 1) drawBackground(ctx, fillProgress, grid);
      else ctx.drawImage(cachedBackground(grid), 0, 0, width, height);

      reportPhase(time);
      if (time <= PHASE_FILL) return;

      const sinceFill = time - PHASE_FILL;
      const cycle = getCycle(Math.floor(sinceFill / CYCLE_TOTAL));
      const cycleTime = sinceFill % CYCLE_TOTAL;

      const fireProgress = clamp01(cycleTime / CYCLE_FIRE);
      const boxProgress = clamp01((cycleTime - CYCLE_FIRE) / CYCLE_BOX);
      const labelProgress = clamp01((cycleTime - CYCLE_FIRE - CYCLE_BOX) / CYCLE_LABEL);
      const fade = cycleTime > CYCLE_TOTAL - CYCLE_FADE ? 1 - (cycleTime - (CYCLE_TOTAL - CYCLE_FADE)) / CYCLE_FADE : 1;
      if (fade <= 0.01) return;

      const fireCount = cycle.cells.length;
      ctx.shadowBlur = grid.cellSize * 0.7;
      for (let i = 0; i < fireCount; i++) {
        const threshold = i / fireCount;
        if (fireProgress <= threshold) break;
        const localT = (fireProgress - threshold) / (1 - threshold + 0.001);
        const { col, row, color } = cycle.cells[i];
        ctx.globalAlpha = Math.min(1, localT * 2.5) * fade;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.fillRect(grid.x(col), grid.y(row), grid.cellSize, grid.cellSize);
      }
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      const { minCol, maxCol, minRow, maxRow } = cycle.bounds;
      const bx = grid.x(minCol) - 4;
      const by = grid.y(minRow) - 4;
      const bw = (maxCol - minCol + 1) * (grid.cellSize + GAP) + GAP + 8;
      const bh = (maxRow - minRow + 1) * (grid.cellSize + GAP) + GAP + 8;

      if (boxProgress > 0) {
        ctx.globalAlpha = boxProgress * fade;
        ctx.strokeStyle = BOX_STROKE;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        traceBoxOutline(ctx, bx, by, bw, bh, boxProgress);
        ctx.setLineDash([]);

        ctx.lineWidth = 3;
        ctx.strokeStyle = ACCENT;
        drawCorners(ctx, bx, by, bw, bh);
      }

      if (labelProgress > 0) {
        const text = `FIRE / ${cycle.confidence}%`;
        ctx.font = labelFont;
        const labelW = ctx.measureText(text).width + 28;
        const labelH = 24;
        const lx = bx;
        const ly = by - labelH - 6;

        ctx.globalAlpha = labelProgress * fade;
        ctx.fillStyle = ACCENT;
        ctx.fillRect(lx, ly, labelW, labelH);

        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, lx + 18, ly + labelH / 2 + 0.5);

        ctx.globalAlpha = (0.5 + 0.5 * Math.sin(now / 160)) * labelProgress * fade;
        ctx.beginPath();
        ctx.arc(lx + 10, ly + labelH / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    };

    const still = () => motionQuery.matches;

    const frame = (now) => {
      raf = 0;
      const dt = lastNow ? Math.min(now - lastNow, 50) : 0;
      lastNow = now;
      elapsed += dt / 1000;
      draw(elapsed, now);
      if (visible && !still() && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (still()) {
        draw(STILL_ELAPSED, 0);
        return;
      }
      if (!raf) {
        lastNow = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      backgroundCache = null;
      draw(still() ? STILL_ELAPSED : elapsed, performance.now());
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0.15 }
    );
    intersectionObserver.observe(canvas);

    const onVisibility = () => {
      if (!document.hidden && visible) start();
    };
    const onMotionChange = () => {
      stop();
      if (visible) start();
    };
    document.addEventListener('visibilitychange', onVisibility);
    motionQuery.addEventListener('change', onMotionChange);

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motionQuery.removeEventListener('change', onMotionChange);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
