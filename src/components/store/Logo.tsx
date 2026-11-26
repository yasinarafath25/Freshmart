import Link from "next/link";

export function LeafMark({ className = "size-11" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M8 50C6 30 18 12 40 8c4 20-6 40-30 44" fill="#3FA34D" />
      <path d="M22 56c4-22 18-36 38-42-2 24-16 40-38 42" fill="#166B3A" />
      <path d="M10 50c8-14 16-24 28-32M24 54c8-14 18-24 30-32" stroke="#A3D94B" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ name = "FreshMart", tagline = "Eat Fresh, Live Healthy", light = false }: { name?: string; tagline?: string; light?: boolean }) {
  const split = name.match(/^(Fresh)(.*)$/);
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label={`${name} home`}>
      <LeafMark />
      <span className="leading-none">
        <span className={`block font-display text-2xl font-extrabold tracking-tight sm:text-[28px] ${light ? "text-white" : "text-brand-700"}`}>
          {split ? (
            <>
              {split[1]}
              <span className={light ? "text-lime-400" : "text-leaf-500"}>{split[2]}</span>
            </>
          ) : (
            name
          )}
        </span>
        <span className={`mt-0.5 hidden text-[13px] sm:block ${light ? "text-white/70" : "text-ink-600"}`}>{tagline}</span>
      </span>
    </Link>
  );
}
