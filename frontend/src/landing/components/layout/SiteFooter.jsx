import Logo from '@/landing/components/brand/Logo';
import ArrowLink from '@/landing/components/ui/ArrowLink';
import { chapters, consoleLink, site } from '@/landing/lib/site';

const COLUMNS = [
  {
    title: 'System',
    links: chapters.map((chapter) => ({ label: chapter.title, href: `#${chapter.id}` })),
  },
  {
    title: 'Console',
    links: [
      { label: 'Live camera', href: consoleLink('live') },
      { label: 'Image test', href: consoleLink('upload') },
      { label: 'Event history', href: consoleLink('history') },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'API reference', href: `${site.apiUrl}/docs`, external: true },
      { label: 'Source code', href: site.repoUrl, external: true },
      { label: 'Report an issue', href: `${site.repoUrl}/issues`, external: true },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer id="footer" className="relative overflow-hidden bg-hero-bg text-hero-light [color-scheme:dark]" data-surface="dark">
      <section id="try" className="relative scroll-mt-0 px-[clamp(18px,4.4vw,64px)] pt-[150px] pb-[128px] max-[640px]:pt-[104px] max-[640px]:pb-[96px]" aria-labelledby="closing-title">
        <div className="mx-auto max-w-[1000px] text-center" data-reveal>
          <p className="m-0 font-mono text-[10px] leading-none tracking-[0.12em] uppercase text-[#8a827a]">
            {site.name} · {site.tagline}
          </p>
          <h2 id="closing-title" className="my-[22px] mx-auto mb-[20px] font-serif text-[clamp(48px,6.4vw,92px)] leading-none tracking-[-0.035em] font-normal [&_em]:whitespace-nowrap [&_em]:not-italic [&_em]:text-[color-mix(in_srgb,#f2ede4_86%,#d97757)]">
            Automated fire protection. Zero guesswork.
          </h2>
          <p className="mx-auto max-w-[34em] font-serif text-[17px] leading-[1.6] text-[#a39a91]">
            Connect any standard camera or webcam to start detecting fire and smoke with real-time verification and automatic evidence logging.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-3">
            <ArrowLink href={consoleLink('live')}>
              Launch Live Monitor
            </ArrowLink>
            <ArrowLink href={site.repoUrl} variant="secondary" external>
              View on GitHub
            </ArrowLink>
          </div>
        </div>
      </section>

      <div className="relative mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-16 px-[clamp(18px,4.4vw,64px)] pt-14 pb-16 before:absolute before:top-0 before:left-[clamp(18px,4.4vw,64px)] before:right-[clamp(18px,4.4vw,64px)] before:h-px before:bg-[#292522] before:content-[''] max-[960px]:grid-cols-1 max-[960px]:gap-11">
        <div className="">
          <Logo />
          <p className="mt-[18px] max-w-[26em] font-serif text-sm leading-[1.55] text-[#8f877f]">
            Real-time fire and smoke detection, smart false-alarm filtering, and instant photo plus video evidence.
          </p>
        </div>

        <nav className="grid grid-cols-3 gap-8 max-[640px]:grid-cols-2 max-[640px]:gap-y-9" aria-label="Footer">
          {COLUMNS.map((column) => (
            <div key={column.title} className="">
              <h3 className="m-0 mb-4 font-sans text-xs leading-[1.4] font-semibold tracking-normal text-hero-light">{column.title}</h3>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="group inline-flex items-baseline gap-[5px] font-sans text-[13px] leading-[1.4] text-slate-400 no-underline underline-offset-[0.25em] transition-colors duration-200 ease-out hover:text-white hover:underline"
                      {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {link.label}
                      {link.external && (
                        <span className="text-[11px] opacity-60 transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-px group-hover:-translate-y-px" aria-hidden="true">
                          ↗
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="relative mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-[clamp(18px,4.4vw,64px)] pt-[22px] pb-[calc(26px+env(safe-area-inset-bottom,0px))] font-mono text-[11px] leading-[1.4] tracking-[0.04em] text-[#756e67] before:absolute before:top-0 before:left-[clamp(18px,4.4vw,64px)] before:right-[clamp(18px,4.4vw,64px)] before:h-px before:bg-[#292522] before:content-[''] max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-2">
        <span>© 2026 {site.name}</span>
        <a href="#top" className="text-inherit no-underline transition-colors duration-200 ease-out hover:text-hero-light">
          Back to top <span aria-hidden="true">↑</span>
        </a>
      </div>
    </footer>
  );
}
