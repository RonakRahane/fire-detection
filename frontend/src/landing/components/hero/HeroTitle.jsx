import { useCallback, useState } from 'react';
import WarpText from '@/landing/components/warp-text/WarpText';

const WARP_STYLE = { position: 'absolute', inset: 0, height: '100%', minHeight: 0 };

export default function HeroTitle({ text, label }) {
  const [ink, setInk] = useState(null);

  const handleLayout = useCallback(({ width, inkTop, inkBottom }) => {
    setInk((current) => {
      const next = { width, top: inkTop, height: inkBottom - inkTop };
      const unchanged =
        current && ['width', 'top', 'height'].every((key) => Math.abs(current[key] - next[key]) < 0.5);
      return unchanged ? current : next;
    });
  }, []);

  const inkStyle = ink
    ? { '--ink-w': `${ink.width}px`, '--ink-top': `${ink.top}px`, '--ink-h': `${ink.height}px` }
    : undefined;

  return (
    <div className="relative max-w-full animate-[title-in_1.4s_var(--ease-out)_0.25s_both] [--pad-x:calc(var(--tsize)*0.16)] [--pad-y:calc(var(--tsize)*0.13)] [--arm:clamp(12px,calc(var(--tsize)*0.11),20px)] [--ink-w:calc(var(--tsize)*3.98)] [--ink-h:calc(var(--tsize)*0.74)] [--ink-top:calc(var(--tsize)*0.41)] [width:calc(var(--ink-w)+var(--pad-x)*2)] [height:calc(var(--ink-h)+var(--pad-y)*2)]" style={inkStyle} aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 w-[min(100vw,1440px)] [height:calc(var(--tsize)*1.7)] [transform:translate(-50%,calc(-1*(var(--ink-top)+var(--ink-h)/2)))]">
        <WarpText
          text={text}
          color="#f2ede4"
          fontFamily="var(--font-serif)"
          fontWeight={400}
          fontSize="var(--tsize)"
          letterSpacing="-0.022em"
          lineHeight={1}
          warpStrength={0.08}
          warpScale={1.7}
          speed={0.55}
          pointerInfluence={0.42}
          pointerStrength={0.38}
          refraction={0.018}
          ripple
          grain={0.85}
          onLayout={handleLayout}
          style={WARP_STYLE}
        />
      </div>

      {ink && (
        <div className="pointer-events-none absolute inset-0">
          <i className={`${"absolute size-[var(--arm)] before:absolute before:h-[1.5px] before:w-full before:origin-top-left before:bg-clay before:content-[\"\"] before:animate-[corner-draw-x_0.9s_var(--ease-out)_1.15s_both] after:absolute after:h-full after:w-[1.5px] after:origin-top-left after:bg-clay after:content-[\"\"] after:animate-[corner-draw-y_0.9s_var(--ease-out)_1.15s_both]"} ${"left-0 top-0"}`} />
          <i className={`${"absolute size-[var(--arm)] before:absolute before:h-[1.5px] before:w-full before:origin-top-left before:bg-clay before:content-[\"\"] before:animate-[corner-draw-x_0.9s_var(--ease-out)_1.15s_both] after:absolute after:h-full after:w-[1.5px] after:origin-top-left after:bg-clay after:content-[\"\"] after:animate-[corner-draw-y_0.9s_var(--ease-out)_1.15s_both]"} ${"right-0 top-0 [&::before]:origin-top-right [&::after]:origin-top-right"}`} />
          <i className={`${"absolute size-[var(--arm)] before:absolute before:h-[1.5px] before:w-full before:origin-top-left before:bg-clay before:content-[\"\"] before:animate-[corner-draw-x_0.9s_var(--ease-out)_1.15s_both] after:absolute after:h-full after:w-[1.5px] after:origin-top-left after:bg-clay after:content-[\"\"] after:animate-[corner-draw-y_0.9s_var(--ease-out)_1.15s_both]"} ${"bottom-0 left-0 [&::before]:origin-bottom-left [&::after]:origin-bottom-left"}`} />
          <i className={`${"absolute size-[var(--arm)] before:absolute before:h-[1.5px] before:w-full before:origin-top-left before:bg-clay before:content-[\"\"] before:animate-[corner-draw-x_0.9s_var(--ease-out)_1.15s_both] after:absolute after:h-full after:w-[1.5px] after:origin-top-left after:bg-clay after:content-[\"\"] after:animate-[corner-draw-y_0.9s_var(--ease-out)_1.15s_both]"} ${"bottom-0 right-0 [&::before]:origin-bottom-right [&::after]:origin-bottom-right"}`} />
          <span className="absolute bottom-[calc(100%+12px)] left-0 inline-flex items-center gap-[7px] whitespace-nowrap font-mono text-[10px] leading-none tracking-[0.12em] uppercase text-[color-mix(in_srgb,#f2ede4_78%,transparent)] animate-[tag-in_0.7s_var(--ease-out)_1.75s_both] max-[640px]:bottom-[calc(100%+9px)] max-[640px]:text-[9px]">
            <span className="size-[5px] rounded-full bg-clay animate-[tag-pulse_2.4s_ease-in-out_2.4s_infinite]" />
            {label}
          </span>
        </div>
      )}
    </div>
  );
}
