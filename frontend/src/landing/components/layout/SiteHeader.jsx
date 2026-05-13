import { useEffect, useRef } from 'react';
import Logo from '@/landing/components/brand/Logo';
import { consoleLink } from '@/landing/lib/site';

const HIDE_AFTER = 160;
const SCROLL_SLOP = 6;

export default function SiteHeader() {
  const headerRef = useRef(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;

    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const probe = header.offsetHeight / 2;
      const overDark = Array.from(document.querySelectorAll('[data-surface="dark"]')).some((surface) => {
        const rect = surface.getBoundingClientRect();
        return rect.top <= probe && rect.bottom >= probe;
      });

      header.dataset.tone = overDark ? 'dark' : 'light';
      header.dataset.scrolled = y > 8 ? 'true' : 'false';

      const delta = y - lastY;
      if (y < HIDE_AFTER || header.contains(document.activeElement)) header.dataset.hidden = 'false';
      else if (delta > SCROLL_SLOP) header.dataset.hidden = 'true';
      else if (delta < -SCROLL_SLOP) header.dataset.hidden = 'false';
      if (Math.abs(delta) > SCROLL_SLOP) lastY = y;
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    header.addEventListener('focusin', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      header.removeEventListener('focusin', schedule);
    };
  }, []);

  return (
    <header ref={headerRef} className="fixed inset-x-0 top-0 z-50 h-[68px] border-b border-transparent text-hero-light transition-[transform,background-color,border-color,color] duration-450 ease-[var(--ease-out)] data-[hidden=true]:-translate-y-full data-[tone=dark]:data-[scrolled=true]:border-b-[rgba(242,237,228,0.07)] data-[tone=dark]:data-[scrolled=true]:bg-[color-mix(in_srgb,#000_74%,transparent)] data-[tone=dark]:data-[scrolled=true]:backdrop-blur-[14px] data-[tone=dark]:data-[scrolled=true]:backdrop-saturate-[1.1] data-[tone=light]:border-b-[#d1cfc5] data-[tone=light]:bg-[color-mix(in_srgb,#faf9f5_86%,transparent)] data-[tone=light]:text-slate-950 data-[tone=light]:backdrop-blur-[14px] data-[tone=light]:backdrop-saturate-[1.1]">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-[clamp(18px,4.4vw,64px)]">
        <Logo />

        <a className="whitespace-nowrap font-sans text-sm leading-none tracking-[-0.0025em] underline decoration-1 decoration-[color-mix(in_srgb,currentColor_55%,transparent)] underline-offset-[0.35em] transition-[text-decoration-color] duration-250 ease-out hover:decoration-current" href={consoleLink('live')}>
          Launch Console
        </a>
      </div>
    </header>
  );
}
