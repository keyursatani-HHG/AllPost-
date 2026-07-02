import Link from "next/link";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
  href?: string | null;
  /** Render the wordmark in white (for dark backgrounds). */
  light?: boolean;
};

/**
 * Postly brandmark — the paper-plane glyph on a green gradient tile plus the
 * wordmark. Matches the approved design exactly.
 */
export function Logo({
  className,
  showWordmark = true,
  href = "/",
  light = false,
}: LogoProps) {
  const mark = (
    <span className={cn("flex items-center gap-[11px]", className)}>
      <span
        className="grid size-[38px] place-items-center rounded-[11px] bg-brand-gradient"
        style={{ boxShadow: "0 6px 16px rgba(34,197,94,0.32)" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 11.5L21 3l-8.5 18-2.4-7.1L3 11.5z" fill="#fff" />
        </svg>
      </span>
      {showWordmark && (
        <span
          className={cn(
            "text-xl font-extrabold tracking-tight",
            light ? "text-white" : "text-[#0F172A] dark:text-white"
          )}
        >
          {siteConfig.name}
        </span>
      )}
    </span>
  );

  if (href === null) return mark;

  return (
    <Link
      href={href}
      aria-label={`${siteConfig.name} home`}
      className="rounded-lg focus-ring"
    >
      {mark}
    </Link>
  );
}
