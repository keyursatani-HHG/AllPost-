import { testimonials } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/reveal";

export function Testimonials() {
  return (
    <section id="about" className="scroll-mt-20 bg-muted px-6 py-24">
      <div className="mx-auto max-w-[1200px]">
        <Reveal className="mx-auto mb-14 max-w-[680px] text-center">
          <span className="mb-4 inline-block rounded-full bg-[#DCFCE7] px-3.5 py-1.5 text-[13px] font-bold text-[#16A34A]">
            TESTIMONIALS
          </span>
          <h2 className="text-[32px] font-black leading-[1.1] tracking-[-0.03em] text-[#0F172A] sm:text-[44px] dark:text-white">
            Loved by <span className="text-gradient">thousands</span> of users
          </h2>
          <p className="mt-3.5 text-[18px] text-[#64748B] dark:text-slate-300">
            Creators, agencies and marketing teams rely on Postly every day.
          </p>
        </Reveal>

        <RevealGroup className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
          {testimonials.map((t) => (
            <RevealItem key={t.name}>
              <article className="flex h-full flex-col rounded-[18px] border border-[#EEF2F6] bg-white p-[26px] shadow-card dark:bg-card">
                <div
                  className="mb-3.5 text-[15px] tracking-[2px] text-[#F59E0B]"
                  aria-label="5 out of 5 stars"
                >
                  ★★★★★
                </div>
                <p className="mb-[22px] flex-1 text-[15.5px] leading-relaxed text-[#334155] dark:text-slate-200">
                  {t.text}
                </p>
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-11 place-items-center rounded-full text-[14px] font-bold text-white"
                    style={{ background: t.color }}
                  >
                    {t.init}
                  </span>
                  <div>
                    <div className="text-[14.5px] font-bold text-[#0F172A] dark:text-white">
                      {t.name}
                    </div>
                    <div className="text-[13px] text-[#94A3B8]">{t.role}</div>
                  </div>
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
