import BrandMark from './BrandMark';

export default function Logo({ href = '#top', className = '', markSize = 18, ...props }) {
  return (
    <a
      href={href}
      className={`group ${"inline-flex items-center gap-[10px] text-inherit no-underline"} ${className}`.trim()}
      aria-label="FireCatch home"
      {...props}
    >
      <BrandMark size={markSize} className="shrink-0 transition-transform duration-500 ease-[var(--ease-out)] group-hover:rotate-90" />
      <span className="font-sans font-medium text-[16px] leading-none tracking-[-0.025em]">FireCatch</span>
    </a>
  );
}
