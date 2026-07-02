/**
 * Bespoke visuals for each feature row. Pure markup — no image assets.
 */

/* Platform brand glyphs used by the cross-post grid */
const platformTiles = [
  {
    bg: "linear-gradient(135deg,#E1306C,#F77737)",
    shadow: "0 10px 22px rgba(225,48,108,0.28)",
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5.5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="#fff" stroke="none" />
      </svg>
    ),
  },
  {
    bg: "#0F172A",
    shadow: "0 10px 22px rgba(15,23,42,0.24)",
    svg: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff">
        <path d="M16.6 5.8a4.3 4.3 0 0 1-1-2.8h-3v11.6a2.4 2.4 0 1 1-2.4-2.5c.2 0 .5 0 .7.1V9.1a5.6 5.6 0 0 0-.7 0 5.4 5.4 0 1 0 5.4 5.4V8.9a7.2 7.2 0 0 0 4 1.2V7.1a4.3 4.3 0 0 1-3-1.3z" />
      </svg>
    ),
  },
  {
    bg: "#FF0000",
    shadow: "0 10px 22px rgba(255,0,0,0.24)",
    svg: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="#fff">
        <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.3 5 12 5 12 5s-6.3 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.7 19 12 19 12 19s6.3 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5 3z" />
      </svg>
    ),
  },
  {
    bg: "#0A66C2",
    shadow: "0 10px 22px rgba(10,102,194,0.26)",
    svg: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff">
        <path d="M20.4 3H3.6A.6.6 0 0 0 3 3.6v16.8a.6.6 0 0 0 .6.6h16.8a.6.6 0 0 0 .6-.6V3.6a.6.6 0 0 0-.6-.6zM8.3 18.3H5.5V9.7h2.8v8.6zM6.9 8.5a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2zm11.4 9.8h-2.8v-4.2c0-1-.4-1.7-1.3-1.7-.7 0-1.1.5-1.3 1-.1.2-.1.4-.1.7v4.2H10s0-7.6 0-8.6h2.8v1.2c.4-.6 1-1.4 2.5-1.4 1.8 0 3.1 1.2 3.1 3.7v5.1z" />
      </svg>
    ),
  },
  {
    bg: "#1D1D1F",
    shadow: "0 10px 22px rgba(29,29,31,0.26)",
    svg: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
        <path d="M17.5 3h3.2l-7 8 8.2 10.9h-6.4l-5-6.6-5.8 6.6H1.5l7.5-8.6L1 3h6.6l4.6 6.1L17.5 3zm-1.1 16.9h1.8L7.7 4.9H5.8l10.6 15z" />
      </svg>
    ),
  },
  {
    bg: "#1877F2",
    shadow: "0 10px 22px rgba(24,119,242,0.26)",
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
        <path d="M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.3C16.4 2.2 15.5 2 14.5 2c-2.3 0-3.9 1.4-3.9 4v2.5H8v3.2h2.6V22h3.4v-10.3h2.5l.4-3.2H14z" />
      </svg>
    ),
  },
];

function CrossPostVisual() {
  return (
    <div className="rounded-[20px] border border-[#EEF2F6] bg-white p-[26px] shadow-card">
      <div className="grid grid-cols-3 gap-3">
        {platformTiles.map((tile, i) => (
          <div
            key={i}
            className="grid aspect-square place-items-center rounded-[14px]"
            style={{
              background: tile.bg,
              boxShadow: tile.shadow,
              animation: `heroFloat ${3.2 + i * 0.1}s ease-in-out infinite`,
              animationDelay: `${i * 0.12}s`,
            }}
          >
            {tile.svg}
          </div>
        ))}
      </div>
      <div className="mt-[18px] flex items-center gap-2.5 rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] px-4 py-3">
        <span className="relative grid size-[22px] place-items-center">
          <span className="absolute inset-0 rounded-full bg-[#22C55E] opacity-30" />
          <svg
            className="relative"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16A34A"
            strokeWidth="3"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
        <span className="text-[14px] font-bold text-[#166534]">
          Published to 6 platforms in 2.1s
        </span>
      </div>
    </div>
  );
}

function CalendarVisual() {
  const cells = [
    "linear-gradient(135deg,#DBEAFE,#93C5FD)",
    "dashed",
    "linear-gradient(135deg,#DCFCE7,#86EFAC)",
    "dashed",
    "linear-gradient(135deg,#FEF3C7,#FCD34D)",
    "dashed",
    "linear-gradient(135deg,#EDE9FE,#C4B5FD)",
  ];
  return (
    <div className="rounded-[20px] border border-[#EEF2F6] bg-white p-[26px] shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[14px] font-extrabold text-[#0F172A]">October 2026</span>
        <span className="text-[12px] font-semibold text-[#94A3B8]">Week view</span>
      </div>
      <div className="grid grid-cols-7 gap-[7px]">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={`h${i}`} className="h-5 rounded-[5px] bg-[#F1F5F9]" />
        ))}
        {cells.map((c, i) =>
          c === "dashed" ? (
            <div
              key={`c${i}`}
              className="h-11 rounded-[7px] border border-dashed border-[#E2E8F0] bg-[#F8FAFC]"
            />
          ) : (
            <div key={`c${i}`} className="h-11 rounded-[7px]" style={{ background: c }} />
          )
        )}
      </div>
      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-[#EEF2F6] bg-[#F8FAFC] px-[15px] py-3">
        <span className="grid size-[30px] place-items-center rounded-lg bg-[#2563EB]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <path d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </span>
        <span className="text-[13.5px] font-semibold text-[#334155]">
          Auto-scheduled at each platform&apos;s best time
        </span>
      </div>
    </div>
  );
}

function LibraryVisual() {
  const rows = [
    { thumb: "linear-gradient(135deg,#DBEAFE,#BFDBFE)", w1: "70%", w2: "45%", tag: "Live", tagBg: "#DCFCE7", tagColor: "#16A34A" },
    { thumb: "linear-gradient(135deg,#DCFCE7,#BBF7D0)", w1: "60%", w2: "38%", tag: "Queued", tagBg: "#DBEAFE", tagColor: "#2563EB" },
    { thumb: "linear-gradient(135deg,#FEF3C7,#FDE68A)", w1: "80%", w2: "50%", tag: "Draft", tagBg: "#F1F5F9", tagColor: "#64748B" },
  ];
  return (
    <div className="rounded-[20px] border border-[#EEF2F6] bg-white p-[22px] shadow-card">
      <div className="mb-4 flex gap-2">
        <span className="rounded-lg bg-[#0F172A] px-3 py-1.5 text-[12px] font-bold text-white">All</span>
        <span className="rounded-lg bg-[#F1F5F9] px-3 py-1.5 text-[12px] font-semibold text-[#64748B]">Scheduled</span>
        <span className="rounded-lg bg-[#F1F5F9] px-3 py-1.5 text-[12px] font-semibold text-[#64748B]">Drafts</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-[#EEF2F6] p-3">
            <span className="size-[42px] shrink-0 rounded-[9px]" style={{ background: r.thumb }} />
            <div className="flex-1">
              <div className="mb-[7px] h-[9px] rounded bg-[#E2E8F0]" style={{ width: r.w1 }} />
              <div className="h-[9px] rounded bg-[#EEF2F6]" style={{ width: r.w2 }} />
            </div>
            <span
              className="rounded-md px-2.5 py-1 text-[11px] font-bold"
              style={{ background: r.tagBg, color: r.tagColor }}
            >
              {r.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudioVisual() {
  return (
    <div className="rounded-[20px] bg-[#0F172A] p-7 text-white shadow-[0_24px_56px_rgba(15,23,42,0.22)]">
      <div className="mb-[18px] flex items-center gap-2.5">
        <span className="size-[9px] rounded-full bg-[#5BC878]" />
        <span className="text-[13px] font-bold text-[#94A3B8]">AI Content Studio</span>
      </div>
      <div className="mb-3.5 rounded-[14px] border border-white/10 bg-white/[0.06] p-4">
        <div className="text-[13.5px] leading-relaxed text-[#CBD5E1]">
          ✨ Generate 5 caption variations for a product launch, upbeat tone
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <div
          className="rounded-[11px] px-3.5 py-3 text-[13px] leading-snug text-[#DCFCE7]"
          style={{
            background:
              "linear-gradient(135deg,rgba(91,200,120,0.16),rgba(34,197,94,0.06))",
            border: "1px solid rgba(91,200,120,0.3)",
          }}
        >
          🚀 Big things are here. Meet the update you&apos;ve been waiting for →
        </div>
        <div className="rounded-[11px] bg-white/5 px-3.5 py-3 text-[13px] leading-snug text-[#94A3B8]">
          Your next favorite tool just dropped. Say hello 👋
        </div>
      </div>
      <button className="mt-4 w-full rounded-[11px] bg-brand-gradient py-3 text-[14px] font-bold text-white">
        ✨ Generate more
      </button>
    </div>
  );
}

export function FeatureVisual({ visual }: { visual: string }) {
  switch (visual) {
    case "crosspost":
      return <CrossPostVisual />;
    case "calendar":
      return <CalendarVisual />;
    case "library":
      return <LibraryVisual />;
    case "studio":
      return <StudioVisual />;
    default:
      return null;
  }
}
