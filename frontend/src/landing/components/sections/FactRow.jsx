
export default function FactRow({ facts }) {
  return (
    <dl className="m-0 grid grid-cols-3 border-b border-[#d1cfc5] max-[760px]:grid-cols-1" data-reveal>
      {facts.map((fact, index) => (
        <div key={fact.label} className={`${"py-4 pr-[18px] pb-[18px] pl-0 max-[760px]:flex max-[760px]:items-baseline max-[760px]:justify-between max-[760px]:gap-4 max-[760px]:px-0 max-[760px]:py-3"} ${index ? "border-l border-[#d1cfc5] pl-[18px] max-[760px]:border-l-0 max-[760px]:border-t max-[760px]:px-0" : ''}`}>
          <dt className="font-mono text-[10px] leading-none tracking-[0.08em] uppercase text-slate-600">{fact.label}</dt>
          <dd className="mt-2.5 font-serif text-[16px] leading-[1.3] text-slate-950 max-[760px]:m-0">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
