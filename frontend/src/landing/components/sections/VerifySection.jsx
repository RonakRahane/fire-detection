import { alertLevels, verificationSpecs } from '@/landing/lib/content';
import AlertLadder from './AlertLadder';

export default function VerifySection() {
  return (
    <section id="verify" className="mt-[120px] scroll-mt-[100px] max-[760px]:mt-[88px]" aria-labelledby="verify-title">
      <div data-reveal>
        <p className="m-0 block font-mono text-[11px] leading-[1.2] font-medium tracking-[0.1em] uppercase text-slate-600">02 / Filtering</p>
        <h2 id="verify-title" className="my-4 mb-[18px] font-serif text-[clamp(27px,2.3vw,32px)] leading-[1.15] tracking-[-0.012em] font-normal text-slate-950 [text-wrap:balance]">
          Multi-layer filtering to minimize false alarms.
        </h2>
      </div>

      <div className={`${"grid grid-cols-2 gap-10 max-[760px]:grid-cols-1 max-[760px]:gap-[18px]"} ${"mt-[30px]"}`} data-reveal>
        <p className="m-0 mb-[18px] font-serif text-[18px] leading-[1.62] text-[#262624] [text-wrap:pretty] max-[760px]:text-[17px]">
          Traditional motion sensors and basic AI models trigger repeatedly on red shirts, desk lamps, or sunset
          reflections. FireCatch applies a secondary physics check to ensure only genuine fire triggers an alert.
        </p>
        <p className="m-0 font-sans text-sm leading-[1.6] text-slate-600 [text-wrap:pretty]">
          Every fire candidate is re-evaluated for color temperature, core brightness, and flame variance.
          A dedicated person filter prevents hair or dark clothing from being mistaken for smoke, and signals must
          persist across multiple consecutive frames before an alarm sounds.
        </p>
      </div>

      <dl className="mt-11 grid grid-cols-3 border-y border-b-[#d1cfc5] border-t-slate-950 max-[760px]:grid-cols-1" data-reveal>
        {verificationSpecs.map((spec) => (
          <div key={spec.label} className="min-h-[120px] border-r border-[#d1cfc5] px-[18px] py-5 first:pl-0 last:border-r-0 max-[760px]:min-h-0 max-[760px]:border-r-0 max-[760px]:border-b max-[760px]:px-0 max-[760px]:py-4 max-[760px]:last:border-b-0">
            <dt className="font-mono text-[10px] leading-none tracking-[0.08em] uppercase text-slate-600">{spec.label}</dt>
            <dd className="mt-4 font-serif text-[25px] leading-[1.15] tracking-[-0.01em] font-normal text-slate-950 max-[760px]:mt-2.5 max-[760px]:text-[22px]">{spec.value}</dd>
          </div>
        ))}
      </dl>

      <AlertLadder levels={alertLevels} />

      <aside className="mt-9 rounded-md border border-[#d1cfc5] bg-[#f0eee6] px-5 py-[18px]" data-reveal aria-label="Operational accuracy notice">
        <p className="m-0 mb-1.5 font-mono text-[11px] leading-[1.2] font-medium tracking-[0.08em] uppercase text-slate-950">Operational Note on Detection Accuracy</p>
        <p className="m-0 font-sans text-[13px] leading-[1.55] text-slate-600 [text-wrap:pretty]">
          Computer vision systems are not 100% accurate. While our multi-layer filtering significantly reduces
          false positives, occasional false alerts can still occur due to optical reflections, intense sunlight, or
          flame-colored lighting. FireCatch should be used to assist human monitoring and never as a sole replacement for
          certified fire safety equipment.
        </p>
      </aside>
    </section>
  );
}
