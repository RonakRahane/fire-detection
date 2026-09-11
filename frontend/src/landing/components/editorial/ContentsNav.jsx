import { useEffect, useState } from 'react';

const ACTIVATION_LINE = 0.4;

export default function ContentsNav({ items }) {
  const [activeId, setActiveId] = useState(items[0]?.id);

  useEffect(() => {
    const targets = items.map((item) => document.getElementById(item.id)).filter(Boolean);
    let frame = 0;

    const update = () => {
      frame = 0;
      const line = window.innerHeight * ACTIVATION_LINE;
      let current = targets[0];
      for (const target of targets) {
        if (target.getBoundingClientRect().top <= line) current = target;
      }
      if (current) setActiveId(current.id);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [items]);

  return (
    <nav className="[font-feature-settings:normal]" aria-label="Contents">
      <p className="m-0 mb-4 font-mono text-[10px] leading-none tracking-[0.08em] uppercase text-slate-600">Contents</p>
      <ol className="m-0 list-none p-0">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="group flex items-center gap-3 py-[5px] font-serif text-sm leading-[1.35] text-slate-600 no-underline transition-colors duration-250 ease-out hover:text-slate-950 data-[active]:text-slate-950"
                data-active={active || undefined}
                aria-current={active ? 'location' : undefined}
              >
                <span className="size-[7px] shrink-0 rounded-full border border-current transition-[background-color,border-color,transform] duration-300 ease-out group-data-[active]:scale-[1.15] group-data-[active]:border-slate-950 group-data-[active]:bg-slate-950" aria-hidden="true" />
                <span className="transition-transform duration-350 ease-[var(--ease-out)] group-data-[active]:translate-x-[2px]">{item.index}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
