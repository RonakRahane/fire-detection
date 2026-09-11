
const ARROWS = { external: '↗', down: '↓', up: '↑', right: '→' };

export default function ArrowLink({
  href,
  children,
  variant = 'primary',
  arrow = 'external',
  external = false,
  className = '',
}) {
  const externalProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  const variantClass = variant === 'secondary'
    ? 'text-[color-mix(in_srgb,var(--hero-light)_62%,transparent)] transition-colors duration-250 ease-out hover:text-hero-light after:opacity-35'
    : 'text-hero-light after:opacity-70';

  return (
    <a href={href} className={`group relative inline-flex items-baseline gap-1.5 pb-1.5 font-sans text-sm leading-none tracking-[-0.005em] no-underline whitespace-nowrap after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px after:bg-current after:origin-left hover:after:animate-underline-sweep ${variantClass} ${className}`.trim()} {...externalProps}>
      <span>{children}</span>
      <span className={`${"inline-block font-sans transition-transform duration-350 ease-[var(--ease-out)]"} ${arrow === 'external' ? 'group-hover:translate-x-[2px] group-hover:-translate-y-[2px]' : arrow === 'down' ? 'group-hover:translate-y-[2px]' : arrow === 'up' ? 'group-hover:-translate-y-[2px]' : 'group-hover:translate-x-[3px]'}`} data-direction={arrow} aria-hidden="true">
        {ARROWS[arrow]}
      </span>
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}
