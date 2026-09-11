
export default function EventRecord({ event }) {
  return (
    <figure className="mt-12" data-reveal>
      <figcaption className="flex justify-between border-b border-slate-950 pb-3 font-mono text-[10px] leading-none font-medium tracking-[0.09em] uppercase text-slate-600">
        <span>Incident Record</span>
        <span>events.json</span>
      </figcaption>
      <dl className="m-0">
        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-[18px] border-b border-[#d1cfc5] py-[11px] transition-colors duration-250 ease-out hover:bg-[#f0eee6b3] max-[760px]:grid-cols-1 max-[760px]:gap-1">
          <dt className="font-mono text-[10px] leading-[1.7] tracking-[0.08em] uppercase text-slate-600">Event</dt>
          <dd className={`${"m-0 font-mono text-[13px] leading-[1.6] text-slate-950 [font-variant-numeric:tabular-nums] [overflow-wrap:anywhere]"} ${"tracking-[0.04em]"}`}>{event.id}</dd>
        </div>
        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-[18px] border-b border-[#d1cfc5] py-[11px] transition-colors duration-250 ease-out hover:bg-[#f0eee6b3] max-[760px]:grid-cols-1 max-[760px]:gap-1">
          <dt className="font-mono text-[10px] leading-[1.7] tracking-[0.08em] uppercase text-slate-600">Recorded</dt>
          <dd className="m-0 font-mono text-[13px] leading-[1.6] text-slate-950 [font-variant-numeric:tabular-nums] [overflow-wrap:anywhere]">{event.recorded}</dd>
        </div>
        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-[18px] border-b border-[#d1cfc5] py-[11px] transition-colors duration-250 ease-out hover:bg-[#f0eee6b3] max-[760px]:grid-cols-1 max-[760px]:gap-1">
          <dt className="font-mono text-[10px] leading-[1.7] tracking-[0.08em] uppercase text-slate-600">Level</dt>
          <dd className="m-0 font-mono text-[13px] leading-[1.6] text-slate-950 [font-variant-numeric:tabular-nums] [overflow-wrap:anywhere]">
            <span className="mr-2.5 inline-flex items-center gap-1.5 border border-[#d9775773] py-[3px] pr-[7px] pl-[6px] text-[11px] tracking-[0.08em] uppercase text-clay-ink before:size-[5px] before:rounded-full before:bg-clay before:content-['']" data-level={event.level}>
              {event.level}
            </span>
            {event.summary}
          </dd>
        </div>
        {event.rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[120px_minmax(0,1fr)] gap-[18px] border-b border-[#d1cfc5] py-[11px] transition-colors duration-250 ease-out hover:bg-[#f0eee6b3] max-[760px]:grid-cols-1 max-[760px]:gap-1">
            <dt className="font-mono text-[10px] leading-[1.7] tracking-[0.08em] uppercase text-slate-600">{row.label}</dt>
            <dd className="m-0 font-mono text-[13px] leading-[1.6] text-slate-950 [font-variant-numeric:tabular-nums] [overflow-wrap:anywhere]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}
