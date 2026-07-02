import Link from "next/link";

import { Button } from "@/components/ui/button";
import { HeroVisual } from "@/components/sections/hero-visual";
import { heroAvatars } from "@/lib/content";

export function Hero() {
  return (
    <section className="relative px-6 pb-[90px] pt-[130px] sm:pt-[150px]">
      {/* Decorative radial glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-[120px] size-[520px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(91,200,120,0.16), transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[120px] top-[120px] size-[460px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(37,99,235,0.10), transparent 65%)",
        }}
      />

      <div className="relative mx-auto max-w-[1080px] text-center">
        {/* Badge */}
        <div
          className="mb-6 inline-flex animate-fade-up items-center gap-2 rounded-full border border-[#DCFCE7] bg-[#F0FDF4] px-3.5 py-[7px] text-[13px] font-semibold text-[#16A34A]"
          style={{ animationDelay: "0.05s" }}
        >
          <span className="size-[7px] rounded-full bg-[#22C55E]" />
          Trusted by 12,000+ creators &amp; teams
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-up text-[40px] font-black leading-[1.02] tracking-[-0.04em] text-[#0F172A] sm:text-[52px] lg:text-[68px] dark:text-white"
          style={{ animationDelay: "0.1s" }}
        >
          Post to all platforms
          <br />
          <span className="text-gradient">instantly</span>
        </h1>

        {/* Subtext */}
        <p
          className="mx-auto mt-5 max-w-[600px] animate-fade-up text-[18px] leading-relaxed text-[#475569] sm:text-[20px] dark:text-slate-300"
          style={{ animationDelay: "0.15s" }}
        >
          Publish across every platform in seconds. Manage all your social
          accounts from one powerful, beautifully simple dashboard.
        </p>

        {/* CTAs */}
        <div
          className="mt-8 flex animate-fade-up flex-wrap justify-center gap-3.5"
          style={{ animationDelay: "0.2s" }}
        >
          <Button asChild variant="brand" size="lg" className="text-base">
            <Link href="/register">Start Posting →</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base">
            <Link href="/#features">View Platform</Link>
          </Button>
        </div>

        {/* Social proof */}
        <div
          className="mt-7 flex animate-fade-up flex-wrap items-center justify-center gap-4"
          style={{ animationDelay: "0.25s" }}
        >
          <div className="flex items-center">
            {heroAvatars.map((a, i) => (
              <span
                key={a.init}
                className="grid size-[38px] place-items-center rounded-full border-[2.5px] border-white text-[12.5px] font-bold text-white"
                style={{
                  background: a.color,
                  marginRight: i < heroAvatars.length - 1 ? -10 : 0,
                }}
              >
                {a.init}
              </span>
            ))}
          </div>
          <div className="text-left">
            <div className="text-[14px] tracking-[2px] text-[#F59E0B]">★★★★★</div>
            <div className="text-[13px] font-medium text-[#64748B]">
              4.9/5 from 12,480 reviews
            </div>
          </div>
        </div>

        {/* Showcase */}
        <div
          className="relative mt-[66px] animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
