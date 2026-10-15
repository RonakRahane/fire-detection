
export default function HeroIndex({ items }) {
  return (
    <nav className="w-[min(360px,calc(100vw-48px))] font-serif text-[13.5px] leading-none text-hero-light max-[760px]:w-[min(260px,70vw)] max-[760px]:text-[12.5px]" aria-label="Page sections">
      <ol className="-mt-[5.5px] list-none p-0">
        {items.map((item, i) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="group flex items-baseline gap-1.5 py-[5.5px] text-inherit no-underline transition-opacity duration-250 ease-out has-[~_*:hover]:opacity-50">
              <span className="font-mono text-[11px] leading-none tracking-[0.02em] transition-colors duration-250 ease-out group-hover:text-clay group-focus-visible:text-clay">({i + 1})</span>
              <span className="flex-1 -translate-y-[3px] border-b border-dotted opacity-45 transition-opacity duration-250 ease-out group-hover:opacity-85 group-focus-visible:opacity-85" aria-hidden="true" />
              <span className="transition-transform duration-350 ease-[var(--ease-out)] group-hover:-translate-x-[3px] group-focus-visible:-translate-x-[3px]">{item.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
