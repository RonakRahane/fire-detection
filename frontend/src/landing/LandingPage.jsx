import Editorial from '@/landing/components/editorial/Editorial';
import Hero from '@/landing/components/hero/Hero';
import SiteFooter from '@/landing/components/layout/SiteFooter';
import SiteHeader from '@/landing/components/layout/SiteHeader';
import RevealObserver from '@/landing/components/motion/RevealObserver';

document.documentElement.setAttribute('data-js', '');

export default function LandingPage() {
  return (
    <div className="min-h-[100svh] bg-hero-bg font-serif text-[16px] leading-[1.5] text-slate-950 [font-feature-settings:'pnum'_on,'lnum'_on,'liga'_on] [&_[data-reveal]]:transition-[opacity,transform] [&_[data-reveal]]:duration-[900ms] [&_[data-reveal]]:ease-[var(--ease-out)] [&_[data-reveal]]:[transition-delay:var(--reveal-delay,0ms)] [&_[data-reveal]:not([data-revealed])]:translate-y-[18px] [&_[data-reveal]:not([data-revealed])]:opacity-0">
      <a className="fixed top-2.5 left-1/2 z-[100] -translate-x-1/2 -translate-y-[200%] rounded-lg bg-hero-light px-5 py-3 font-sans text-sm leading-none font-semibold text-hero-bg no-underline transition-transform duration-250 ease-out focus:translate-y-0" href="#introduction">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <Editorial />
      </main>
      <SiteFooter />
      <RevealObserver />
    </div>
  );
}
