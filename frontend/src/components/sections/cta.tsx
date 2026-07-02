import Link from "next/link";

import { Reveal } from "@/components/shared/reveal";

export function CTA() {
  return (
    <section className="px-6 pb-[100px] pt-10">
      <Reveal className="relative mx-auto max-w-[1100px] overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0F172A] to-[#1E293B] px-6 py-20 text-center sm:px-10">
        <div
          aria-hidden
          className="absolute -right-[60px] -top-[100px] size-[360px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(91,200,120,0.28), transparent 65%)" }}
        />
        <div
          aria-hidden
          className="absolute -bottom-[120px] -left-[60px] size-[360px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.24), transparent 65%)" }}
        />
        <div className="relative">
          <h2 className="text-[32px] font-black leading-[1.08] tracking-[-0.03em] text-white sm:text-[48px]">
            Start growing today
          </h2>
          <p className="mx-auto mt-4 max-w-[520px] text-[18px] leading-relaxed text-[#CBD5E1] sm:text-[19px]">
            Join thousands of creators and teams publishing smarter. No credit
            card required.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <Link
              href="/register"
              className="rounded-xl bg-brand-gradient px-8 py-4 text-[16.5px] font-bold text-white shadow-[0_14px_34px_rgba(34,197,94,0.4)] transition-all hover:-translate-y-0.5 hover:brightness-105"
            >
              Start Free Trial →
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/20 bg-white/[0.06] px-8 py-4 text-[16.5px] font-bold text-white transition-colors hover:bg-white/[0.12]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
