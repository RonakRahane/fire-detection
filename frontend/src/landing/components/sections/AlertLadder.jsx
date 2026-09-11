
const DOTS = 5;
const RANK = { safe: 1, suspicious: 2, warning: 3, danger: 4, critical: 5 };

export default function AlertLadder({ levels }) {
  return (
    <div className="mt-14" data-reveal>
      <ul className="m-0 list-none border-t border-slate-950 p-0">
        {levels.map((level) => {
          const rank = RANK[level.id] ?? 0;
          return (
            <li key={level.id} className="grid grid-cols-[72px_112px_minmax(0,1fr)_auto] items-baseline gap-[18px] border-b border-[#d1cfc5] py-3.5 [--level:#87867f] data-[level=safe]:[--level:#788c5d] data-[level=suspicious]:[--level:#9c9a92] data-[level=warning]:[--level:#d4a056] data-[level=danger]:[--level:#d97757] data-[level=critical]:[--level:#bf4d43] max-[760px]:grid-cols-[64px_minmax(0,1fr)_auto] max-[760px]:gap-y-2" data-level={level.id}>
              <span className="inline-flex self-center gap-[3px]">
                {Array.from({ length: DOTS }, (_, j) => (
                  <span
                    key={j}
                    className="size-[9px] border border-[#d1cfc5] transition-[background-color,border-color] duration-400 ease-out [transition-delay:calc(0.35s+var(--rank)*90ms+var(--j)*45ms)] data-[on]:border-[var(--level)] data-[on]:bg-[var(--level)]"
                    style={{ '--rank': rank, '--j': j }}
                    {...(j < rank ? { 'data-on': '' } : {})}
                  />
                ))}
              </span>
              <span className="font-mono text-[11px] leading-none font-medium tracking-[0.08em] uppercase text-slate-950">{level.name}</span>
              <span className="font-serif text-[16px] leading-[1.4] text-[#262624] max-[760px]:col-span-full max-[760px]:row-start-2 max-[760px]:text-[15px]">{level.rule}</span>
              <span className="whitespace-nowrap font-mono text-xs leading-none text-slate-600 [font-variant-numeric:tabular-nums] max-[760px]:col-start-3 max-[760px]:row-start-1">{level.trigger}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
