import Link from "next/link";

import { Logo } from "@/components/shared/logo";

const perfBars = [
  { h: 38, green: false },
  { h: 56, green: false },
  { h: 44, green: false },
  { h: 72, green: true },
  { h: 88, green: true },
  { h: 64, green: false },
  { h: 100, green: true },
];

/**
 * Split-screen auth chrome — dark-navy brand panel (left, desktop only) with a
 * performance mock, and a centered form panel (right). Mirrors authpane design.
 */
export function AuthShell({
  heading,
  subtext,
  children,
}: {
  heading: string;
  subtext: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh grid-cols-1 bg-muted lg:grid-cols-2">
      {/* LEFT BRAND PANEL */}
      <aside className="relative hidden flex-col justify-between overflow-hidden p-14 lg:flex lg:p-[60px] bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
        <div
          aria-hidden
          className="absolute -right-[90px] -top-[120px] size-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(91,200,120,0.30), transparent 65%)" }}
        />
        <div
          aria-hidden
          className="absolute -bottom-[140px] -left-[90px] size-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.24), transparent 65%)" }}
        />

        <div className="relative z-[2]">
          <Logo light />
        </div>

        <div className="relative z-[2] max-w-[440px]">
          <h1 className="mb-[18px] text-[42px] font-black leading-[1.1] tracking-[-0.03em] text-white">
            {heading}
          </h1>
          <p className="mb-10 text-[17.5px] leading-relaxed text-[#CBD5E1]">{subtext}</p>

          {/* mini performance mock */}
          <div className="relative">
            <div className="rounded-[18px] border border-white/10 bg-white/[0.07] p-[22px] backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#94A3B8]">Weekly performance</span>
                <span className="text-[12px] font-bold text-[#5BC878]">▲ 24%</span>
              </div>
              <div className="flex h-24 items-end gap-2.5">
                {perfBars.map((b, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md"
                    style={{
                      height: `${b.h}%`,
                      background: b.green
                        ? "linear-gradient(180deg,#5BC878,#22C55E)"
                        : "rgba(255,255,255,0.14)",
                    }}
                  />
                ))}
              </div>
            </div>
            <div
              className="absolute -right-4 -top-[22px] flex items-center gap-2.5 rounded-[13px] bg-white px-[15px] py-[11px] shadow-[0_16px_34px_rgba(0,0,0,0.28)]"
              style={{ animation: "heroFloat 5s ease-in-out infinite" }}
            >
              <span className="grid size-[30px] place-items-center rounded-lg bg-[#DCFCE7]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <span className="text-[12px] font-bold text-[#0F172A]">9 platforms live</span>
            </div>
            <div
              className="absolute -bottom-6 -left-[18px] flex items-center gap-2.5 rounded-[13px] bg-white px-[15px] py-[11px] shadow-[0_16px_34px_rgba(0,0,0,0.28)]"
              style={{ animation: "heroFloat2 6s ease-in-out infinite" }}
            >
              <span className="text-[12px] tracking-[1px] text-[#F59E0B]">★★★★★</span>
              <span className="text-[12px] font-bold text-[#0F172A]">4.9 rating</span>
            </div>
          </div>
        </div>

        <div className="relative z-[2] flex flex-wrap gap-x-[26px] gap-y-2 text-[13.5px] font-semibold text-[#94A3B8]">
          <span>✓ Free 14-day trial</span>
          <span>✓ No credit card</span>
          <span>✓ Cancel anytime</span>
        </div>
      </aside>

      {/* RIGHT FORM PANEL */}
      <main className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-[420px] animate-fade-up">
          {/* mobile logo */}
          <Link href="/" className="mb-[30px] flex items-center gap-2.5 lg:hidden">
            <Logo href={null} />
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
