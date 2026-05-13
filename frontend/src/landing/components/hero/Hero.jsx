import ArrowLink from '@/landing/components/ui/ArrowLink';
import { chapters, consoleLink, site } from '@/landing/lib/site';
import HeroIndex from './HeroIndex';
import HeroStage from './HeroStage';
import HeroTitle from './HeroTitle';

export default function Hero() {
  return (
    <section id="top" className="relative min-h-[120svh] bg-hero-bg text-hero-light [color-scheme:dark] [--p:0] [--tsize:clamp(60px,min(12.5vw,21svh),208px)] max-[760px]:min-h-[112svh] max-[760px]:[--tsize:min(19vw,15svh)]" data-surface="dark" aria-labelledby="hero-title">
      <HeroStage className="sticky top-0 isolate flex min-h-[100svh] flex-col overflow-hidden">
        <div className="relative z-[1] flex flex-1 flex-col items-center px-6 pt-[calc(68px+clamp(16px,4svh,44px))] pb-[clamp(84px,12svh,124px)] [opacity:calc(1-var(--p)*0.9)] [transform:translate3d(0,calc(var(--p)*-5svh),0)] max-[760px]:pt-[92px] max-[760px]:pb-[88px]">
          <div className="my-auto flex w-[min(100%,880px)] flex-col items-center text-center">
            <p className="m-0 mb-[clamp(36px,4.8svh,46px)] font-sans text-[13px] leading-none tracking-[0.16em] uppercase text-[color-mix(in_srgb,#f2ede4_84%,transparent)] animate-[lockup-in_1.1s_var(--ease-out)_0.1s_both] max-[760px]:text-[11px]">{site.tagline}</p>
            <h1 id="hero-title" className="sr-only">
              {site.name}
            </h1>
            <HeroTitle text={site.name} label="Fire · 94%" />
            <p className="mx-auto mt-[clamp(28px,4.6svh,46px)] max-w-[34em] font-serif text-[clamp(16px,1.25vw,19px)] leading-[1.6] text-[color-mix(in_srgb,#f2ede4_64%,transparent)] [text-wrap:balance] animate-[lockup-in_1.1s_var(--ease-out)_0.55s_both] max-[760px]:max-w-[21em] max-[760px]:text-[16.5px]">{site.summary}</p>

            <div className="mt-[clamp(22px,3.4svh,30px)] flex flex-wrap justify-center gap-x-8 gap-y-3 animate-[lockup-in_1.1s_var(--ease-out)_0.7s_both]">
              <ArrowLink href={consoleLink('live')}>
                Launch Live Monitor
              </ArrowLink>
              <ArrowLink href={consoleLink('upload')} variant="secondary">
                Test with an Image
              </ArrowLink>
            </div>
          </div>

          <div className="mt-[clamp(40px,6svh,64px)] animate-[lockup-in_1.1s_var(--ease-out)_0.9s_both]">
            <HeroIndex items={chapters} />
          </div>
        </div>

        <a href="#introduction" className="absolute left-1/2 bottom-[calc(clamp(14px,2.6svh,26px)+env(safe-area-inset-bottom,0px))] z-[2] -translate-x-1/2 px-4 py-3 font-sans text-xs leading-none tracking-[-0.01em] text-[color-mix(in_srgb,#f2ede4_55%,transparent)] no-underline transition-colors duration-200 ease-out hover:text-[color-mix(in_srgb,#f2ede4_88%,transparent)] [opacity:calc(1-var(--p)*5)]">
          <span className="inline-flex gap-[7px] animate-[fade-in_1s_var(--ease-out)_1.8s_both]">
            Explore features
            <span className="inline-block animate-[cue-bob_2.6s_var(--ease-in-out)_2.4s_infinite]" aria-hidden="true">
              ↓
            </span>
          </span>
        </a>
      </HeroStage>
    </section>
  );
}
