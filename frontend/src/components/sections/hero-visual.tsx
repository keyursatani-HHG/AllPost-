"use client";

import { motion } from "framer-motion";

import { platforms } from "@/lib/content";

/** Orbiting platform bubble (hidden below 1080px, matching the design). */
function OrbitBubble({
  platform,
  style,
  duration,
}: {
  platform: (typeof platforms)[number];
  style: React.CSSProperties;
  duration: number;
}) {
  return (
    <div
      className="absolute z-[4] hidden items-center gap-[9px] rounded-[14px] border border-[#EEF2F6] bg-white px-[14px] py-[10px] shadow-[0_14px_34px_rgba(15,23,42,0.12)] min-[1081px]:flex"
      style={{ ...style, animation: `heroFloat ${duration}s ease-in-out infinite` }}
      aria-hidden
    >
      <span
        className="grid size-[26px] place-items-center rounded-[8px] text-[11px] font-extrabold text-white"
        style={{ background: platform.bg }}
      >
        {platform.code}
      </span>
      <span className="text-[13px] font-bold text-[#0F172A]">{platform.name}</span>
    </div>
  );
}

const bubblePositions: React.CSSProperties[] = [
  { top: 34, left: -70 }, // Instagram
  { top: 130, left: -100 }, // TikTok
  { top: 250, left: -72 }, // X
  { top: 34, right: -78 }, // YouTube
  { top: 130, right: -104 }, // LinkedIn
  { top: 250, right: -70 }, // Facebook
];
const bubbleDurations = [5, 6.5, 7, 6, 6.8, 7.5];

const barHeights = [40, 58, 46, 74, 90, 66, 100];
const barGreen = [false, false, false, true, true, false, true];

const scheduled = [
  { bg: "linear-gradient(135deg,#E1306C,#F77737)", time: "9:00", w1: "75%", w2: "45%" },
  { bg: "#0A66C2", time: "12:30", w1: "60%", w2: "38%" },
  { bg: "#0F172A", time: "17:00", w1: "68%", w2: "50%" },
];

export function HeroVisual() {
  return (
    <div className="relative">
      {/* orbiting platform bubbles */}
      {platforms.map((p, i) => (
        <OrbitBubble
          key={p.name}
          platform={p}
          style={bubblePositions[i]}
          duration={bubbleDurations[i]}
        />
      ))}

      {/* floating toast */}
      <div
        className="absolute -top-6 right-11 z-[5] hidden items-center gap-[11px] rounded-[14px] border border-[#EEF2F6] bg-white px-[15px] py-[11px] shadow-[0_18px_40px_rgba(15,23,42,0.18)] min-[1081px]:flex"
        style={{ animation: "heroFloat2 5.5s ease-in-out infinite" }}
        aria-hidden
      >
        <span className="grid size-8 place-items-center rounded-[9px] bg-[#DCFCE7]">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
        <div className="text-left">
          <div className="text-[12.5px] font-bold text-[#0F172A]">Published to 9 platforms</div>
          <div className="text-[11px] text-[#94A3B8]">2.3 seconds ago</div>
        </div>
      </div>

      {/* browser-framed dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-[2] overflow-hidden rounded-[20px] border border-[#EEF2F6] bg-white shadow-[0_40px_90px_rgba(15,23,42,0.16)]"
        aria-hidden
      >
        {/* window chrome */}
        <div className="flex items-center gap-[14px] border-b border-[#EEF2F6] bg-[#F8FAFC] px-[18px] py-[14px]">
          <div className="flex gap-[7px]">
            <span className="size-[11px] rounded-full bg-[#FCA5A5]" />
            <span className="size-[11px] rounded-full bg-[#FDE68A]" />
            <span className="size-[11px] rounded-full bg-[#86EFAC]" />
          </div>
          <div className="mx-auto max-w-[320px] flex-1 rounded-lg border border-[#EEF2F6] bg-white px-[14px] py-[6px] text-center text-[12.5px] font-medium text-[#94A3B8]">
            app.postly.com/dashboard
          </div>
        </div>

        <div className="grid min-h-[420px] grid-cols-1 text-left sm:grid-cols-[210px_1fr]">
          {/* sidebar */}
          <div className="hidden flex-col gap-1.5 bg-[#0F172A] px-4 py-[22px] sm:flex">
            <div className="flex items-center gap-[9px] px-2 pb-[18px]">
              <span className="grid size-[30px] place-items-center rounded-[9px] bg-brand-gradient">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 11.5L21 3l-8.5 18-2.4-7.1L3 11.5z" fill="#fff" />
                </svg>
              </span>
              <span className="text-[16px] font-extrabold text-white">Postly</span>
            </div>
            {[
              { label: "Dashboard", active: true },
              { label: "Calendar", active: false },
              { label: "Library", active: false },
              { label: "Studio", active: false },
              { label: "Analytics", active: false },
            ].map((item) => (
              <div
                key={item.label}
                style={item.active ? { background: "rgba(91,200,120,0.16)" } : undefined}
                className={
                  "flex items-center gap-[11px] rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold " +
                  (item.active ? "text-[#5BC878]" : "text-[#94A3B8]")
                }
              >
                <span
                  className="size-2 rounded-[2px]"
                  style={{ background: item.active ? "#5BC878" : "#334155" }}
                />
                {item.label}
              </div>
            ))}
          </div>

          {/* main */}
          <div className="px-[26px] py-6">
            <div className="mb-[22px] flex items-center justify-between">
              <div>
                <div className="text-[19px] font-extrabold tracking-tight text-[#0F172A]">
                  Good morning, Jane 👋
                </div>
                <div className="mt-[3px] text-[13px] text-[#94A3B8]">
                  Here&apos;s what&apos;s happening across your channels.
                </div>
              </div>
              <button className="rounded-[10px] bg-brand-gradient px-[18px] py-2.5 text-[13px] font-bold text-white shadow-glow">
                + New Post
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Reach card */}
              <div className="rounded-2xl border border-[#EEF2F6] p-[18px]">
                <div className="mb-[14px] flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#64748B]">Reach this week</span>
                  <span className="text-[12px] font-extrabold text-[#16A34A]">▲ 18%</span>
                </div>
                <div className="mb-4 text-[30px] font-black tracking-tight text-[#0F172A]">2.4M</div>
                <div className="flex h-[70px] items-end gap-2">
                  {barHeights.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-[5px]"
                      style={{
                        height: `${h}%`,
                        background: barGreen[i]
                          ? "linear-gradient(180deg,#5BC878,#22C55E)"
                          : "#EEF2F6",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Scheduled card */}
              <div className="rounded-2xl border border-[#EEF2F6] p-[18px]">
                <div className="mb-[14px] text-[13px] font-bold text-[#64748B]">Scheduled today</div>
                <div className="flex flex-col gap-[11px]">
                  {scheduled.map((row) => (
                    <div key={row.time} className="flex items-center gap-[11px]">
                      <span
                        className="size-[34px] shrink-0 rounded-[9px]"
                        style={{ background: row.bg }}
                      />
                      <div className="flex-1">
                        <div
                          className="mb-1.5 h-2 rounded bg-[#E2E8F0]"
                          style={{ width: row.w1 }}
                        />
                        <div className="h-2 rounded bg-[#EEF2F6]" style={{ width: row.w2 }} />
                      </div>
                      <span className="text-[11px] font-bold text-[#94A3B8]">{row.time}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-[14px] flex items-center gap-2 rounded-[10px] border border-[#DCFCE7] bg-[#F0FDF4] px-3 py-2.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span className="text-[12.5px] font-bold text-[#166534]">All queued &amp; on time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
