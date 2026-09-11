import { evidenceParts, sampleEvent } from '@/landing/lib/content';
import EventRecord from './EventRecord';
import EvidenceStrip from './EvidenceStrip';

export default function CaptureSection() {
  return (
    <section id="capture" className="mt-[120px] scroll-mt-[100px] max-[760px]:mt-[88px]" aria-labelledby="capture-title">
      <div data-reveal>
        <p className="m-0 block font-mono text-[11px] leading-[1.2] font-medium tracking-[0.1em] uppercase text-slate-600">03 / Evidence</p>
        <h2 id="capture-title" className="my-4 mb-[18px] font-serif text-[clamp(27px,2.3vw,32px)] leading-[1.15] tracking-[-0.012em] font-normal text-slate-950 [text-wrap:balance]">
          Instant photo and video proof with every alert.
        </h2>
        <p className="m-0 mb-[18px] font-serif text-[18px] leading-[1.62] text-[#262624] [text-wrap:pretty] max-[760px]:text-[17px]">
          When an alert goes off, you should not have to rewind security tapes to understand what happened.
          FireCatch packages a high-resolution snapshot and an animated video clip with every confirmed incident.
        </p>
      </div>

      <div className="mt-12 border-y border-b-[#d1cfc5] border-t-slate-950 pt-[30px] pb-[34px]">
        <p className="m-0 mb-6 font-mono text-[10px] leading-none font-medium tracking-[0.09em] uppercase text-slate-600" data-reveal>
          Incident Record Package
        </p>
        <EvidenceStrip />
        <div className={`${"grid grid-cols-2 gap-10 max-[760px]:grid-cols-1 max-[760px]:gap-[18px]"} ${"mt-[30px]"}`} data-reveal>
          {evidenceParts.map((part) => (
            <div key={part.title}>
              <p className="m-0 mb-[7px] font-serif text-[18px] leading-[1.4] font-semibold text-slate-950">{part.title}</p>
              <p className="m-0 font-sans text-sm leading-[1.6] text-slate-600 [text-wrap:pretty]">{part.body}</p>
            </div>
          ))}
        </div>
      </div>

      <EventRecord event={sampleEvent} />

      <p className={`${"m-0 font-sans text-sm leading-[1.6] text-slate-600 [text-wrap:pretty]"} ${"mt-[18px]"}`} data-reveal>
        Live alerts are recorded automatically with a 15-second cooldown between duplicate events. The system retains
        the 100 most recent incidents with complete media, automatically pruning older files to preserve storage.
      </p>
    </section>
  );
}
