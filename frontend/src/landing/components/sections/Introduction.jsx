import { detectionLoop } from '@/landing/lib/content';
import DetectionLoop from './DetectionLoop';

export default function Introduction() {
  return (
    <section id="introduction" className="scroll-mt-[100px]" aria-labelledby="introduction-title">
      <div data-reveal>
        <p className="m-0 block font-mono text-[11px] leading-[1.2] font-medium tracking-[0.1em] uppercase text-slate-600">Overview</p>
        <h2 id="introduction-title" className="my-[18px] mb-6 font-serif text-[clamp(32px,3.1vw,42px)] leading-[1.12] tracking-[-0.018em] font-normal text-slate-950 [text-wrap:balance]">
          Spot fire the moment it starts — before smoke turns into disaster.
        </h2>
        <p className={`${"m-0 mb-[18px] font-serif text-[18px] leading-[1.62] text-[#262624] [text-wrap:pretty] max-[760px]:text-[17px]"} ${"text-[21px] leading-[1.56] text-slate-950 max-[760px]:text-[19px]"}`}>
          Standard smoke alarms take precious minutes to activate as heat and smoke drift toward the ceiling.
          FireCatch uses computer vision to detect visible flames and smoke clouds right at the source.
        </p>
        <p className="m-0 mb-[18px] font-serif text-[18px] leading-[1.62] text-[#262624] [text-wrap:pretty] max-[760px]:text-[17px]">
          Every frame is inspected in real time. When a fire hazard appears, FireCatch verifies the threat,
          sounds an alert, and automatically saves photo and video evidence so you can respond immediately.
        </p>
      </div>

      <DetectionLoop steps={detectionLoop} />
    </section>
  );
}
