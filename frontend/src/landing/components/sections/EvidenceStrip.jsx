
const COLS = 12;
const ROWS = 8;
const FRAMES = 8;
const FLAME_COL = 7;
const CORE = ['#f4cd7a', '#f2b866', '#eda15f'];
const BODY = ['#d97757', '#e07055', '#c96442', '#b94f36', '#cf6b52', '#e58a5c'];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildFrame(index) {
  const growth = (index + 1) / FRAMES;
  const shade = seededRandom(31);
  const flicker = seededRandom(400 + index);
  const cells = [];
  let bounds = null;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const base = 0.08 + shade() * 0.2;
      const lift = (ROWS - 1 - row) / (ROWS - 1);
      const halfWidth = 2.4 * Math.pow(1 - lift, 0.8) * Math.sqrt(growth);
      const isFire =
        lift <= 0.78 * growth && Math.abs(col - FLAME_COL) <= halfWidth && flicker() > 0.14 && growth > 0.12;

      if (isFire) {
        const core = Math.abs(col - FLAME_COL) < halfWidth / 2 && lift < 0.45 * growth;
        const palette = core ? CORE : BODY;
        cells.push({ col, row, fill: palette[Math.floor(flicker() * palette.length)] });
        bounds = bounds
          ? {
              minCol: Math.min(bounds.minCol, col),
              maxCol: Math.max(bounds.maxCol, col),
              minRow: Math.min(bounds.minRow, row),
              maxRow: Math.max(bounds.maxRow, row),
            }
          : { minCol: col, maxCol: col, minRow: row, maxRow: row };
      } else {
        cells.push({ col, row, opacity: Math.min(0.32, base + (flicker() > 0.93 ? 0.08 : 0)) });
      }
    }
  }

  return { cells, bounds };
}

const frames = Array.from({ length: FRAMES }, (_, i) => buildFrame(i));

export default function EvidenceStrip() {
  return (
    <figure className="m-0" data-reveal>
      <ol className="m-0 grid list-none grid-cols-8 gap-2 p-0 max-[760px]:grid-cols-4 max-[760px]:gap-y-3.5">
        {frames.map((frame, i) => {
          const isAlert = i === FRAMES - 1;
          return (
            <li key={i} className={`group ${"flex flex-col gap-2"}`} data-alert={isAlert || undefined} style={{ '--i': i }}>
              <svg className="h-auto w-full aspect-[3/2] bg-[#f0eee6] text-slate-950 outline outline-1 outline-[#d1cfc5] [outline-offset:0] animate-[frame-play_2s_steps(1,end)_infinite] [animation-delay:calc(var(--i)*250ms-2s)]" viewBox={`0 0 ${COLS} ${ROWS}`} aria-hidden="true">
                {frame.cells.map(({ col, row, fill, opacity }) => (
                  <rect
                    key={`${col}-${row}`}
                    x={col + 0.07}
                    y={row + 0.07}
                    width="0.86"
                    height="0.86"
                    fill={fill || 'currentColor'}
                    opacity={fill ? 1 : opacity}
                  />
                ))}
                {isAlert && frame.bounds && (
                  <rect
                    className="fill-none stroke-clay stroke-[1.5] [stroke-dasharray:3_2]"
                    x={frame.bounds.minCol - 0.25}
                    y={frame.bounds.minRow - 0.25}
                    width={frame.bounds.maxCol - frame.bounds.minCol + 1.5}
                    height={frame.bounds.maxRow - frame.bounds.minRow + 1.5}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </svg>
              <span className="font-mono text-[9px] leading-none tracking-[0.08em] uppercase text-slate-600 group-data-[alert]:text-clay-ink">{isAlert ? 'Alert' : String(i + 1).padStart(2, '0')}</span>
            </li>
          );
        })}
      </ol>
      <div className="relative mt-3.5 h-px overflow-hidden bg-[#d1cfc5]" aria-hidden="true">
        <span className="absolute inset-y-0 left-0 w-[12.5%] bg-clay animate-[playhead_2s_steps(8,end)_infinite]" />
      </div>
      <figcaption className="mt-3 flex justify-between gap-4 font-mono text-[10px] leading-[1.3] tracking-[0.06em] uppercase text-slate-600 max-[760px]:flex-col max-[760px]:gap-1">
        <span>GIF · 8 frames from a 16-frame buffer</span>
        <span>480 × 360 · 250 ms / frame</span>
      </figcaption>
    </figure>
  );
}
