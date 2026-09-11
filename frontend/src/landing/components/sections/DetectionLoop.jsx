
export default function DetectionLoop({ steps }) {
  return (
    <figure className="mt-14 border-y border-b-[#d1cfc5] border-t-slate-950 pt-[30px] pb-[34px]" data-reveal>
      <figcaption className="m-0 mb-6 font-mono text-[10px] leading-none font-medium tracking-[0.09em] uppercase text-slate-600">The detection loop</figcaption>
      <ol className="m-0 grid list-none grid-cols-4 gap-x-[34px] p-0 max-[760px]:grid-cols-1 max-[760px]:gap-y-10">
        {steps.map((step, i) => (
          <li key={step.title} className={`group ${"relative min-h-[128px] border-l border-[#b8b5ad] pl-4 pr-3.5 max-[760px]:min-h-0 max-[760px]:pb-1 after:absolute after:top-1/2 after:-right-[34px] after:w-[34px] after:-translate-y-1/2 after:text-center after:font-sans after:text-[20px] after:leading-none after:text-slate-500 after:content-[\"→\"] after:animate-[arrow-pulse_var(--cycle)_var(--ease-out)_infinite] after:[animation-delay:calc(var(--i)*var(--cycle)/4+0.7s)] last:after:hidden max-[760px]:after:top-auto max-[760px]:after:-bottom-8 max-[760px]:after:left-0 max-[760px]:after:right-auto max-[760px]:after:w-6 max-[760px]:after:rotate-90 max-[760px]:after:animate-none"}`} style={{ '--i': i, '--cycle': '6s' }}>
            <span className="block font-mono text-[10px] leading-none text-slate-600 transition-colors duration-300 ease-out group-hover:text-clay-ink">{String(i + 1).padStart(2, '0')}</span>
            <strong className="my-3 mb-[7px] block font-sans text-[17px] leading-[1.25] font-medium tracking-[-0.01em] text-slate-950">{step.title}</strong>
            <span className="block font-serif text-sm leading-[1.45] text-slate-600">{step.body}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
