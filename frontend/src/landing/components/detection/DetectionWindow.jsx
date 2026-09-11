import { useCallback, useState } from 'react';
import PixelDetectionAnimation from './PixelDetectionAnimation';

const STATE_LABEL = {
  calibrating: () => 'Starting video feed...',
  scanning: () => 'Scanning for hazards...',
  locked: (confidence) => `Flame Detected · ${confidence}%`,
  clearing: () => 'Incident Logged',
};

export default function DetectionWindow({ source = 'Live Camera Feed · Detection Preview' }) {
  const [state, setState] = useState({ phase: 'calibrating', confidence: null });

  const handlePhase = useCallback(({ phase, confidence }) => setState({ phase, confidence }), []);

  return (
    <figure className="mt-11 border border-[#d1cfc5] bg-[#f0eee6] max-[760px]:-mx-[clamp(18px,4.4vw,64px)] max-[760px]:border-x-0" data-reveal>
      <div className="relative aspect-[3/2]">
        <PixelDetectionAnimation className="absolute inset-0 size-full" onPhaseChange={handlePhase} />
      </div>
      <figcaption className="flex justify-between gap-6 border-t border-[#d1cfc5] py-3 px-3.5 font-mono text-[11px] leading-[1.2] tracking-[0.06em] uppercase text-slate-600 max-[760px]:text-[10px]">
        <span>{source}</span>
        <span className={`group ${"inline-flex items-center gap-2 whitespace-nowrap text-[#30302e] [font-variant-numeric:tabular-nums] data-[phase=locked]:text-slate-950"}`} data-phase={state.phase} aria-hidden="true">
          <span className="size-1.5 rounded-full bg-slate-500 transition-[background-color,box-shadow] duration-300 ease-out group-data-[phase=scanning]:animate-[scan-blink_0.9s_ease-in-out_infinite] group-data-[phase=locked]:bg-clay group-data-[phase=locked]:shadow-[0_0_0_3px_color-mix(in_srgb,#d97757_22%,transparent)] group-data-[phase=clearing]:bg-olive" />
          {STATE_LABEL[state.phase](state.confidence)}
        </span>
        <span className="sr-only">
          Real-time detection preview showing active scanning, flame recognition with confidence score, and incident logging.
        </span>
      </figcaption>
    </figure>
  );
}
