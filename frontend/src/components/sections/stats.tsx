import { stats } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/reveal";

const valueGradient = {
  green: "linear-gradient(135deg,#5BC878,#22C55E)",
  blue: "linear-gradient(135deg,#2563EB,#3B82F6)",
} as const;

export function Stats() {
  return (
    <section id="pricing" className="scroll-mt-20 px-6 py-24">
      <div className="mx-auto max-w-[1200px]">
        <Reveal className="mx-auto mb-14 max-w-[640px] text-center">
          <h2 className="text-[30px] font-black leading-[1.12] tracking-[-0.03em] text-[#0F172A] sm:text-[40px] dark:text-white">
            Numbers that speak for themselves
          </h2>
          <p className="mt-3.5 text-[18px] text-[#64748B] dark:text-slate-300">
            Join a platform built for scale, trusted every single day.
          </p>
        </Reveal>

        <RevealGroup className="grid gap-6 md:grid-cols-3">
          {stats.map((stat) => {
            const isDark = stat.variant === "dark";
            return (
              <RevealItem key={stat.label}>
                <div
                  className={
                    "rounded-[20px] px-8 py-10 text-center " +
                    (isDark
                      ? "bg-[#0F172A] shadow-[0_20px_44px_rgba(15,23,42,0.22)]"
                      : "border border-[#EEF2F6] bg-white shadow-card dark:bg-card")
                  }
                >
                  <div
                    className="text-[52px] font-black leading-none tracking-[-0.03em]"
                    style={
                      isDark
                        ? { color: "#fff" }
                        : {
                            background: valueGradient[stat.variant as "green" | "blue"],
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            color: "transparent",
                          }
                    }
                  >
                    {stat.value}
                    {stat.suffix && (
                      <span style={isDark ? { color: "#5BC878" } : undefined}>
                        {stat.suffix}
                      </span>
                    )}
                  </div>
                  <div
                    className={
                      "mt-3 text-[16px] font-semibold " +
                      (isDark ? "text-[#94A3B8]" : "text-[#475569] dark:text-slate-300")
                    }
                  >
                    {stat.label}
                  </div>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
