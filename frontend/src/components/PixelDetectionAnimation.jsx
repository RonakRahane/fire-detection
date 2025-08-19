// Canvas-based pixel animation component rendering a simulated flame detection cycle.
// Draws grid pixels, emerging flame clusters, animated bounding boxes, and confidence labels at 60fps.

import React, { useEffect, useRef, useCallback } from 'react';

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

const NEUTRAL_COLORS_LIGHT = [
  '#e5e5e3', '#d4d4d2', '#c8c8c4', '#dcdcd8', '#b8b8b4',
  '#eaeae8', '#f0f0ee', '#cfcfcb', '#bfbfbb', '#d8d8d4',
];
const NEUTRAL_COLORS_DARK = [
  '#1e1e21', '#27272a', '#2d2d30', '#222225', '#333336',
  '#1a1a1d', '#2a2a2d', '#252528', '#303033', '#1c1c1f',
];
const FIRE_COLORS = [
  '#ff6b35', '#ff8c42', '#ffd166', '#ef476f', '#ff4500',
  '#ff7043', '#ffab40', '#ffca28', '#ff5722', '#e65100',
  '#ff9800', '#ffc107', '#ff6f00', '#dd2c00', '#bf360c',
];

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

const PixelDetectionAnimation = () => {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);

  const draw = useCallback((timestamp) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsed = (timestamp - startTimeRef.current) / 1000;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    const w = rect.width;
    const h = rect.height;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.scale(dpr, dpr);
    }

    const isDark = document.documentElement.dataset.theme === 'dark';
    const neutralColors = isDark ? NEUTRAL_COLORS_DARK : NEUTRAL_COLORS_LIGHT;

    const cellW = (w - GAP * (COLS + 1)) / COLS;
    const cellH = (h - GAP * (ROWS + 1)) / ROWS;
    const cellSize = Math.max(1, Math.min(cellW, cellH));
    const gridW = COLS * (cellSize + GAP) + GAP;
    const gridH = ROWS * (cellSize + GAP) + GAP;
    const offsetX = (w - gridW) / 2;
    const offsetY = (h - gridH) / 2;

    ctx.clearRect(0, 0, w, h);

    const fillProgress = Math.min(1, elapsed / PHASE_FILL);

    let cycleIndex = 0;
    let cycleTime = 0;

    if (elapsed > PHASE_FILL) {
      const timeSinceFill = elapsed - PHASE_FILL;
      cycleIndex = Math.floor(timeSinceFill / CYCLE_TOTAL);
      cycleTime = timeSinceFill % CYCLE_TOTAL;
    }

    const cyclePosRng = seededRandom(42 + cycleIndex * 13);
    const fw = 8 + Math.floor(cyclePosRng() * 6);
    const fh = 9 + Math.floor(cyclePosRng() * 6);
    const fireMinCol = 4 + Math.floor(cyclePosRng() * (COLS - fw - 8));
    const fireMaxCol = fireMinCol + fw;
    const fireMinRow = 4 + Math.floor(cyclePosRng() * (ROWS - fh - 8));
    const fireMaxRow = fireMinRow + fh;
    const shapeType = Math.floor(cyclePosRng() * 2);
    const confidence = 85 + Math.floor(cyclePosRng() * 14);
    const labelText = `FIRE / ${confidence}%`;

    const fireProgress = Math.min(1, Math.max(0, cycleTime / CYCLE_FIRE));
    const boxProgress = Math.min(1, Math.max(0, (cycleTime - CYCLE_FIRE) / CYCLE_BOX));
    const labelProgress = Math.min(1, Math.max(0, (cycleTime - CYCLE_FIRE - CYCLE_BOX) / CYCLE_LABEL));

    let cycleAlphaMult = 1;
    if (cycleTime > CYCLE_TOTAL - CYCLE_FADE) {
      cycleAlphaMult = 1 - (cycleTime - (CYCLE_TOTAL - CYCLE_FADE)) / CYCLE_FADE;
    }

    const bgRng = seededRandom(42);
    const bgCells = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        bgCells.push({ col, row, order: bgRng() });
      }
    }
    bgCells.sort((a, b) => a.order - b.order);

    const colorRng = seededRandom(123);
    let bgIndex = 0;

    for (const { col, row } of bgCells) {
      const x = offsetX + GAP + col * (cellSize + GAP);
      const y = offsetY + GAP + row * (cellSize + GAP);

      const threshold = bgIndex / bgCells.length;
      if (fillProgress > threshold) {
        const localT = (fillProgress - threshold) / (1 - threshold + 0.001);
        ctx.globalAlpha = Math.min(1, localT * 2);
        ctx.fillStyle = pick(neutralColors, colorRng);
        ctx.fillRect(x, y, cellSize, cellSize);
      }
      bgIndex++;
    }

    if (elapsed > PHASE_FILL && cycleAlphaMult > 0.01) {
      const fireSortRng = seededRandom(777 + cycleIndex);
      const fireColorRng = seededRandom(999 + cycleIndex);
      const fireCells = [];

      for (let row = fireMinRow; row <= fireMaxRow; row++) {
        for (let col = fireMinCol; col <= fireMaxCol; col++) {
          let isFire = true;
          const relX = (col - fireMinCol) / fw;
          const relY = (row - fireMinRow) / fh;

          if (shapeType === 0) {
            const allowedWidth = 0.2 + 0.8 * Math.pow(relY, 1.5); 
            const distFromCenter = Math.abs(relX - 0.5) * 2;
            
            if (distFromCenter > allowedWidth) {
              isFire = false;
            }
            
            if (fireSortRng() > 0.85) isFire = !isFire;
          } else {
            if (fireSortRng() > 0.8) isFire = false;
          }

          if (isFire) {
            fireCells.push({ col, row, order: fireSortRng() });
          }
        }
      }
      fireCells.sort((a, b) => a.order - b.order);

      let actualMinCol = fireMaxCol;
      let actualMaxCol = fireMinCol;
      let actualMinRow = fireMaxRow;
      let actualMaxRow = fireMinRow;

      let fireIndex = 0;
      for (const { col, row } of fireCells) {
        if (col < actualMinCol) actualMinCol = col;
        if (col > actualMaxCol) actualMaxCol = col;
        if (row < actualMinRow) actualMinRow = row;
        if (row > actualMaxRow) actualMaxRow = row;

        const x = offsetX + GAP + col * (cellSize + GAP);
        const y = offsetY + GAP + row * (cellSize + GAP);

        const threshold = fireIndex / fireCells.length;
        if (fireProgress > threshold) {
          const localT = (fireProgress - threshold) / (1 - threshold + 0.001);
          ctx.globalAlpha = Math.min(1, localT * 2.5) * cycleAlphaMult;
          
          const color = pick(FIRE_COLORS, fireColorRng);
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = cellSize * 0.8;
          ctx.fillRect(x, y, cellSize, cellSize);
        }
        fireIndex++;
      }
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      if (fireCells.length === 0) {
        actualMinCol = fireMinCol; actualMaxCol = fireMaxCol;
        actualMinRow = fireMinRow; actualMaxRow = fireMaxRow;
      }

      if (boxProgress > 0) {
        const bx = offsetX + GAP + actualMinCol * (cellSize + GAP) - 4;
        const by = offsetY + GAP + actualMinRow * (cellSize + GAP) - 4;
        const bw = (actualMaxCol - actualMinCol + 1) * (cellSize + GAP) + GAP + 8;
        const bh = (actualMaxRow - actualMinRow + 1) * (cellSize + GAP) + GAP + 8;

        ctx.globalAlpha = boxProgress * cycleAlphaMult;

        ctx.strokeStyle = isDark ? '#f5f5f0' : '#0a0a0a';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);

        const perim = 2 * (bw + bh);
        const drawLen = perim * boxProgress;
        ctx.beginPath();

        let remaining = drawLen;
        const topLen = Math.min(remaining, bw);
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + topLen, by);
        remaining -= topLen;
        
        if (remaining > 0) {
          const rightLen = Math.min(remaining, bh);
          ctx.lineTo(bx + bw, by + rightLen);
          remaining -= rightLen;
        }
        if (remaining > 0) {
          const bottomLen = Math.min(remaining, bw);
          ctx.lineTo(bx + bw - bottomLen, by + bh);
          remaining -= bottomLen;
        }
        if (remaining > 0) {
          const leftLen = Math.min(remaining, bh);
          ctx.lineTo(bx, by + bh - leftLen);
        }

        ctx.stroke();
        ctx.setLineDash([]);

        const cornerLen = Math.min(12, bw * 0.15);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#cf6b52';
        ctx.globalAlpha = boxProgress * cycleAlphaMult;

        ctx.beginPath();
        ctx.moveTo(bx, by + cornerLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + cornerLen, by);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bx + bw - cornerLen, by);
        ctx.lineTo(bx + bw);
        ctx.lineTo(bx + bw, by + cornerLen);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bx + bw, by + bh - cornerLen);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw - cornerLen, by + bh);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bx + cornerLen, by + bh);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx, by + bh - cornerLen);
        ctx.stroke();
      }

      if (labelProgress > 0) {
        const lx = offsetX + GAP + fireMinCol * (cellSize + GAP) - 4;
        const ly = offsetY + GAP + fireMinRow * (cellSize + GAP) - 14;

        ctx.globalAlpha = labelProgress * cycleAlphaMult;

        ctx.font = `600 11px "Geist Mono", monospace`;
        const metrics = ctx.measureText(labelText);
        const labelW = metrics.width + 20;
        const labelH = 24;

        ctx.fillStyle = '#cf6b52';
        ctx.fillRect(lx, ly - labelH, labelW, labelH);

        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, lx + 10, ly - labelH / 2);

        const dotX = lx + 5;
        const dotY = ly - labelH / 2;
        const pulseAlpha = 0.5 + 0.5 * Math.sin(timestamp / 100);
        ctx.globalAlpha = pulseAlpha * labelProgress * cycleAlphaMult;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    animFrameRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  return (
    <div className="pixel-animation-wrapper">
      <canvas
        ref={canvasRef}
        className="pixel-animation-canvas"
        aria-hidden="true"
      />
    </div>
  );
};

export default PixelDetectionAnimation;
