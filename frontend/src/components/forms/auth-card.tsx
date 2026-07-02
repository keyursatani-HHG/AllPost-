import * as React from "react";

/** White auth card with title + subtitle, matching the design. */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-[#EEF2F6] bg-white p-[26px] shadow-[0_24px_60px_rgba(15,23,42,0.10)] sm:p-[34px] dark:border-white/10 dark:bg-card">
      <h2 className="text-[27px] font-extrabold tracking-[-0.02em] text-[#0F172A] dark:text-white">
        {title}
      </h2>
      <p className="mb-[26px] mt-1.5 text-[15px] text-[#64748B] dark:text-slate-400">
        {subtitle}
      </p>
      {children}
    </div>
  );
}

/** "or … with email" divider with hairlines. */
export function AuthDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-[22px] flex items-center gap-3">
      <span className="h-px flex-1 bg-[#EEF2F6] dark:bg-white/10" />
      <span className="text-[12.5px] font-semibold text-[#94A3B8]">{children}</span>
      <span className="h-px flex-1 bg-[#EEF2F6] dark:bg-white/10" />
    </div>
  );
}
