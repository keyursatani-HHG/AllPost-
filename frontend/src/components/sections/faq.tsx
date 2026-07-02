"use client";

import * as React from "react";

import { faqs } from "@/lib/content";
import { Reveal } from "@/components/shared/reveal";

export function Faq() {
  // Single-open accordion; first item open by default (matches the design).
  const [open, setOpen] = React.useState(0);

  return (
    <section id="faq" className="scroll-mt-20 px-6 py-24">
      <div className="mx-auto max-w-[820px]">
        <Reveal className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full bg-[#DCFCE7] px-3.5 py-1.5 text-[13px] font-bold text-[#16A34A]">
            FAQ
          </span>
          <h2 className="text-[30px] font-black leading-[1.12] tracking-[-0.03em] text-[#0F172A] sm:text-[42px] dark:text-white">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-[18px] text-[#64748B] dark:text-slate-300">
            Everything you need to know before getting started.
          </p>
        </Reveal>

        <div className="flex flex-col gap-3.5">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            const panelId = `faq-panel-${i}`;
            const btnId = `faq-btn-${i}`;
            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-[16px] border border-[#EEF2F6] bg-white shadow-[0_6px_20px_rgba(15,23,42,0.04)] dark:bg-card"
              >
                <button
                  id={btnId}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-4 px-[26px] py-[22px] text-left focus-ring"
                >
                  <span className="text-[16px] font-bold text-[#0F172A] sm:text-[17px] dark:text-white">
                    {faq.question}
                  </span>
                  <span
                    className="grid size-[30px] shrink-0 place-items-center rounded-lg transition-transform duration-200"
                    style={{
                      background: isOpen ? "#DCFCE7" : "#F1F5F9",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={isOpen ? "#16A34A" : "#64748B"}
                      strokeWidth="2.5"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  hidden={!isOpen}
                  className="px-[26px] pb-6 text-[15.5px] leading-relaxed text-[#475569] dark:text-slate-300"
                >
                  {faq.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
