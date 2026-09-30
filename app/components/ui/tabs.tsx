import Link from "next/link";

// Ways to look at the same things, as links: each view has its own URL, so
// the back button and a shared link keep it. The current one wears the ▶
// cursor, like the selected line of a Pokémon menu; the cursor's column is
// always there, so nothing moves when the selection does.
export function Tabs({
  label,
  tabs,
}: {
  // What the tabs choose between, for screen readers.
  label: string;
  tabs: { label: string; href: string; current: boolean }[];
}) {
  return (
    <nav aria-label={label}>
      <ul className="flex gap-4">
        {tabs.map((tab) => (
          <li key={tab.label}>
            <Link
              href={tab.href}
              aria-current={tab.current ? "page" : undefined}
              className={`group flex items-center gap-1 px-1 font-mono text-meta tracking-wider uppercase transition-colors duration-75 ease-flick hover:bg-accent hover:text-accent-foreground ${tab.current ? "text-foreground" : "text-muted"}`}
            >
              <span
                aria-hidden
                className={`text-accent group-hover:text-accent-foreground ${tab.current ? "" : "invisible"}`}
              >
                ▶
              </span>
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
