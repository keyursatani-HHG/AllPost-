import Link from "next/link";

import { cn } from "@/lib/utils";
import { features } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { FeatureVisual } from "@/components/sections/feature-visuals";

const accentStyles = {
  green: "bg-[#DCFCE7] text-[#16A34A]",
  blue: "bg-[#DBEAFE] text-[#2563EB]",
} as const;

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 bg-muted px-6 py-24">
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <Reveal className="mx-auto mb-[72px] max-w-[680px] text-center">
          <span className="mb-4 inline-block rounded-full bg-[#DCFCE7] px-3.5 py-1.5 text-[13px] font-bold text-[#16A34A]">
            FEATURES
          </span>
          <h2 className="text-[32px] font-black leading-[1.1] tracking-[-0.03em] text-[#0F172A] sm:text-[44px] dark:text-white">
            Everything you need to grow, in one place
          </h2>
          <p className="mt-4 text-[18px] leading-relaxed text-[#64748B] dark:text-slate-300">
            Powerful tools that replace your entire social media stack — without
            the complexity.
          </p>
        </Reveal>

        {/* Rows */}
        <div className="flex flex-col gap-[110px]">
          {features.map((feature) => (
            <Reveal
              key={feature.title}
              className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
            >
              {/* Copy */}
              <div className={cn(feature.reverse && "lg:order-2")}>
                <span
                  className={cn(
                    "mb-4 inline-block rounded-lg px-3 py-[5px] text-[12.5px] font-bold",
                    accentStyles[feature.accent]
                  )}
                >
                  {feature.eyebrow}
                </span>
                <h3 className="text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#0F172A] sm:text-[34px] dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-3.5 text-[17px] leading-relaxed text-[#475569] dark:text-slate-300">
                  {feature.description}
                </p>
                <Button
                  asChild
                  className="mt-6 bg-[#0F172A] text-white hover:bg-[#1E293B] dark:bg-white dark:text-[#0F172A] dark:hover:bg-slate-200"
                >
                  <Link href="/register">{feature.cta} →</Link>
                </Button>
              </div>

              {/* Visual */}
              <div className={cn(feature.reverse && "lg:order-1")}>
                <FeatureVisual visual={feature.visual} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
