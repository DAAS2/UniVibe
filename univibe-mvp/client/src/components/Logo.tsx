/**
 * UniVibe logo — a hand-drawn "constellation U": two stacked dots joined by an
 * arc, meant to read as both a smile, the letter U, and "finding your people."
 * Monochrome currentColor stroke + warm amber dot accent.
 */
export function Logo({ className = "", size = 28 }: { className?: string; size?: number }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-label="UniVibe">
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Soft cream circle */}
        <circle cx="20" cy="20" r="19" fill="hsl(22 88% 56% / 0.10)" stroke="currentColor" strokeWidth="1.5" />
        {/* The "U" arc — hand-drawn */}
        <path
          d="M11 14 Q11 28 20 28 Q29 28 29 14"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Two anchor dots: the people */}
        <circle cx="11" cy="14" r="2.4" fill="hsl(22 88% 56%)" />
        <circle cx="29" cy="14" r="2.4" fill="hsl(168 42% 42%)" />
      </svg>
      <span className="font-display text-[1.05rem] font-semibold tracking-tight">UniVibe</span>
    </span>
  );
}
