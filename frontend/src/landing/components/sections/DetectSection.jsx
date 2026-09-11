import DetectionWindow from '@/landing/components/detection/DetectionWindow';
import { detectionFacts } from '@/landing/lib/content';
import FactRow from './FactRow';

export default function DetectSection() {
  return (
    <section id="detect" className="mt-[120px] scroll-mt-[100px] max-[760px]:mt-[88px]" aria-labelledby="detect-title">
      <div data-reveal>
        <p className="m-0 block font-mono text-[11px] leading-[1.2] font-medium tracking-[0.1em] uppercase text-slate-600">01 / Detection</p>
        <h2 id="detect-title" className="my-4 mb-[18px] font-serif text-[clamp(27px,2.3vw,32px)] leading-[1.15] tracking-[-0.012em] font-normal text-slate-950 [text-wrap:balance]">
          Real-time flame and smoke tracking.
        </h2>
        <p className="m-0 mb-[18px] font-serif text-[18px] leading-[1.62] text-[#262624] [text-wrap:pretty] max-[760px]:text-[17px]">
          FireCatch scans video feeds up to 10 times per second, overlaying precise bounding boxes and confidence scores
          the instant a fire hazard is recognized.
        </p>
      </div>

      <DetectionWindow />

      <FactRow facts={detectionFacts} />
    </section>
  );
}
