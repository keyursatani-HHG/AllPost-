"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  AlignLeft,
  BadgeCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
  Eye,
  Grid2x2,
  Heart,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Mic,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Repeat2,
  TrendingUp,
  Users,
  Video,
  X,
} from "lucide-react";

import { postsApi, scheduleApi, analyticsApi, ApiError, API_URL } from "@/lib/api";
import type { AnalyticsSummary, CalendarItem, Post, PostStatus, SocialAccount } from "@/types";
import { PlatformGlyph, PlatformRow } from "@/components/dashboard/icons";
import type { ScreenKey } from "@/components/dashboard/sidebar";
import type { ComposerType } from "@/components/dashboard/composer";
import { BulkImageUpload } from "@/components/dashboard/bulk-image";
import { BulkVideoUpload } from "@/components/dashboard/bulk-video";
import { GridVideoStudio } from "@/components/dashboard/grid-video";
import { FadeVideoStudio } from "@/components/dashboard/fade-video";

type User = { name: string; email: string };

const h1 = "text-[30px] font-extrabold tracking-[-0.02em] text-[#0F172A]";
const card = "rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]";

/* -------------------------------------------------------------------------- */
/*  Create                                                                     */
/* -------------------------------------------------------------------------- */
function CreateScreen({
  onCompose,
  onNavigate,
}: {
  onCompose: (t: ComposerType, presetDate?: string) => void;
  onNavigate: (k: ScreenKey) => void;
}) {
  const tiles: { title: string; Icon: typeof AlignLeft; codes: string[]; type: ComposerType }[] = [
    { title: "Text Post", Icon: AlignLeft, codes: ["fb", "bs", "li", "th", "tw", "gb"], type: "text" },
    { title: "Image Post", Icon: ImageIcon, codes: ["fb", "bs", "li", "th", "tw", "ig", "pin", "tt", "gb"], type: "image" },
    { title: "Video Post", Icon: Video, codes: ["fb", "bs", "li", "th", "tw", "ig", "pin", "tt", "yt", "gb"], type: "video" },
    { title: "Story Post", Icon: Camera, codes: ["fb", "ig"], type: "story" },
  ];
  return (
    <div>
      <h1 className={`${h1} mb-[26px]`}>Create a new post</h1>
      <div className="create-grid grid grid-cols-1 gap-[22px] sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <button
            key={t.title}
            onClick={() => onCompose(t.type)}
            className="create-tile flex flex-col items-center rounded-[18px] border border-[#E5E7EB] bg-white px-6 pb-6 pt-10 text-center shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all"
          >
            <span className="mb-[22px] grid size-[74px] place-items-center rounded-[18px] border border-[#EEF2F6] bg-[#F8FAFC] text-[#94A3B8]">
              <t.Icon className="size-[30px]" strokeWidth={1.8} />
            </span>
            <span className="mb-5 text-[19px] font-extrabold tracking-[-0.01em] text-[#0F172A]">
              {t.title}
            </span>
            <PlatformRow codes={t.codes} />
          </button>
        ))}
      </div>
      <div className="mt-[22px] flex items-center gap-2 text-[13.5px] text-[#64748B]">
        <BadgeCheck className="size-[15px] text-[#22C55E]" strokeWidth={2} />
        You can connect more accounts{" "}
        <button onClick={() => onNavigate("connections")} className="font-semibold text-[#16A34A] hover:underline">
          here
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Studio                                                                     */
/* -------------------------------------------------------------------------- */
function StudioScreen() {
  const [tool, setTool] = React.useState<null | "grid" | "fade">(null);
  if (tool === "grid") return <GridVideoStudio onBack={() => setTool(null)} />;
  if (tool === "fade") return <FadeVideoStudio onBack={() => setTool(null)} />;

  const cards: { title: string; desc: string; views: string; Icon: typeof Grid2x2; ready: boolean; onUse?: () => void }[] = [
    { title: "2×2 Grid Video", desc: "Create viral videos with this 4 image grid format (tested & proven).", views: "20M+ views", Icon: Grid2x2, ready: true, onUse: () => setTool("grid") },
    { title: "Single Fade-in Video", desc: "Turn a single image into a short fade-in clip — we do the editing.", views: "500M+ views", Icon: ImageIcon, ready: true, onUse: () => setTool("fade") },
    { title: "AI UGC Creator", desc: "Create authentic UGC-style videos in seconds using our AI-powered templates. Perfect for demos and viral content.", views: "1B+ views", Icon: Mic, ready: false },
  ];
  return (
    <div>
      <h1 className={`${h1} mb-6`}>Content Studio</h1>
      <div className="mb-[22px] flex flex-wrap items-center gap-7 rounded-[18px] border border-[#BBF7D0] bg-gradient-to-br from-[#F0FDF4] to-white px-7 py-[26px]">
        <div className="min-w-[280px] flex-1">
          <div className="mb-3 flex gap-2">
            <span className="rounded-full bg-[#22C55E] px-2.5 py-[3px] text-[11px] font-extrabold text-white">NEW</span>
            <span className="rounded-full bg-[#DCFCE7] px-2.5 py-[3px] text-[11px] font-bold text-[#16A34A]">AI-Powered</span>
          </div>
          <div className="mb-2.5 flex items-center gap-2.5 text-[22px] font-extrabold text-[#0F172A]">
            <span className="text-[#22C55E]">✨</span>AI UGC Video Creator
          </div>
          <p className="mb-3 max-w-[640px] text-[14.5px] leading-relaxed text-[#475569]">
            Create authentic UGC-style videos in seconds using our AI-powered templates. Perfect for product demos, testimonials, and viral marketing content.
          </p>
          <div className="flex items-center gap-5 text-[13px] font-bold text-[#16A34A]">
            <span>🔥 SUPER HOT</span>
            <span className="font-semibold text-[#64748B]">📊 Infinite views</span>
          </div>
        </div>
        <button
          onClick={() => toast.info("Coming soon", { description: "AI UGC Creator isn't available yet." })}
          className="db-btn whitespace-nowrap rounded-xl bg-brand-gradient px-[22px] py-3.5 text-[15px] font-bold text-white"
          style={{ boxShadow: "0 10px 22px rgba(34,197,94,0.28)" }}
        >
          Try AI UGC Creator →
        </button>
      </div>
      <div className="std-grid grid grid-cols-1 gap-[22px] md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className={`std-card flex flex-col p-6 transition-all ${card}`}>
            <span className="mb-[18px] grid size-11 place-items-center rounded-[11px] border border-[#EEF2F6] bg-[#F8FAFC] text-[#64748B]">
              <c.Icon className="size-6" strokeWidth={1.8} />
            </span>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[18px] font-extrabold text-[#0F172A]">{c.title}</span>
              {!c.ready && (
                <span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-extrabold text-[#64748B]">SOON</span>
              )}
            </div>
            <p className="mb-4 flex-1 text-[14px] leading-relaxed text-[#64748B]">{c.desc}</p>
            <div className="mb-[18px] flex items-center gap-4 text-[13px] font-bold text-[#16A34A]">
              <span>🔥 Trending</span>
              <span className="font-semibold text-[#64748B]">📊 {c.views}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  c.ready && c.onUse
                    ? c.onUse()
                    : toast.info("Coming soon", { description: `${c.title} isn't available yet.` })
                }
                className={
                  "db-btn rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-bold text-white " +
                  (c.ready ? "bg-brand-gradient" : "bg-[#CBD5E1]")
                }
              >
                Use Template
              </button>
              <button className="grid size-[38px] place-items-center rounded-[10px] border border-[#E5E7EB] bg-white text-[#64748B]">
                <Eye className="size-[17px]" strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bulk                                                                       */
/* -------------------------------------------------------------------------- */
function BulkScreen() {
  const [tool, setTool] = React.useState<null | "image" | "video">(null);
  if (tool === "image") return <BulkImageUpload onBack={() => setTool(null)} />;
  if (tool === "video") return <BulkVideoUpload onBack={() => setTool(null)} />;

  const cards: { key: string; title: string; desc: string; codes: string[]; ready: boolean; onUse?: () => void }[] = [
    { key: "video-upload", title: "Bulk Video Upload", desc: "Upload and post multiple videos at once.", codes: ["bs"], ready: true, onUse: () => setTool("video") },
    { key: "image", title: "Bulk Image Upload", desc: "Upload and schedule multiple images at once.", codes: ["fb", "ig", "li", "pin", "tt", "tw", "th", "bs"], ready: true, onUse: () => setTool("image") },
    { key: "video-creation", title: "Bulk Video Creation", desc: "Create viral 2×2 grid videos in bulk (AI assisted).", codes: [], ready: false },
  ];
  return (
    <div>
      <h1 className={`${h1} mb-[26px]`}>Bulk tools</h1>
      <div className="bulk-grid grid grid-cols-1 gap-[22px] md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <button
            key={c.title}
            type="button"
            onClick={() =>
              c.ready && c.onUse
                ? c.onUse()
                : toast.info("Coming soon", { description: `${c.title} isn't available yet.` })
            }
            className={`std-card block w-full px-6 pb-6 pt-[34px] text-center transition-all ${card} ${
              c.ready ? "cursor-pointer hover:border-[#86EFAC] hover:shadow-glow" : "cursor-default opacity-80"
            }`}
          >
            <div className="mb-[18px] flex justify-center gap-1.5 text-[#CBD5E1]">
              <Package className="size-7" strokeWidth={1.6} />
              <Video className="size-7" strokeWidth={1.6} />
            </div>
            <div className="mb-4 flex items-center justify-center gap-2">
              <span className="text-[18px] font-extrabold text-[#0F172A]">{c.title}</span>
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                  c.ready ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#F1F5F9] text-[#64748B]"
                }`}
              >
                {c.ready ? "READY" : "SOON"}
              </span>
            </div>
            <p className="mb-[18px] text-[13.5px] leading-normal text-[#94A3B8]">{c.desc}</p>
            {c.codes.length > 0 && <PlatformRow codes={c.codes} size={15} color="#CBD5E1" />}
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Calendar                                                                   */
/* -------------------------------------------------------------------------- */
const CAL_STATUS: Record<string, { border: string; bg: string; text: string }> = {
  queued: { border: "#DBEAFE", bg: "#EFF6FF", text: "#2563EB" },
  scheduled: { border: "#DBEAFE", bg: "#EFF6FF", text: "#2563EB" },
  publishing: { border: "#FEF3C7", bg: "#FFFBEB", text: "#B45309" },
  published: { border: "#DCFCE7", bg: "#F0FDF4", text: "#16A34A" },
  failed: { border: "#FEE2E2", bg: "#FEF2F2", text: "#DC2626" },
  canceled: { border: "#F1F5F9", bg: "#F8FAFC", text: "#94A3B8" },
};
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const CAL_GLYPH: Record<string, string> = {
  instagram: "ig", twitter: "tw", x: "tw", linkedin: "li", facebook: "fb",
  youtube: "yt", tiktok: "tt", pinterest: "pin", threads: "th", bluesky: "bs",
};
const CAL_PLATFORM_BG: Record<string, string> = {
  instagram: "linear-gradient(135deg,#E1306C,#F77737)", twitter: "#1D1D1F", x: "#1D1D1F",
  linkedin: "#0A66C2", facebook: "#1877F2", youtube: "#FF0000", tiktok: "#0F172A",
  pinterest: "#E60023", threads: "#0F172A", bluesky: "#1185FE",
};

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const pad2 = (n: number) => String(n).padStart(2, "0");
/** "YYYY-MM-DD" in local time (matches the backend note_date). */
function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
/** datetime-local string for a day, defaulting to 9:00 AM (or +1h if that's already past today). */
function presetDateTime(day: Date): string | undefined {
  const now = new Date();
  const at = new Date(day);
  at.setHours(9, 0, 0, 0);
  if (at.getTime() <= now.getTime()) {
    if (dayKey(day) === dayKey(now)) at.setTime(now.getTime() + 3600_000);
    else return undefined; // a past day can't be scheduled
  }
  return `${ymd(at)}T${pad2(at.getHours())}:${pad2(at.getMinutes())}`;
}

type CalGroup = {
  key: string;
  when: string;
  content: string;
  hasMedia: boolean;
  status: string;
  platforms: string[];
  url: string | null;
};

// Multiple accounts for the same post at the same time collapse into one entry
// (matching the reference calendar's stacked platform icons + "+N").
function groupItems(items: CalendarItem[]): CalGroup[] {
  const rank = (s: string) => (s === "failed" ? 4 : s === "scheduled" || s === "queued" ? 3 : s === "publishing" ? 2 : 1);
  const m = new Map<string, CalGroup>();
  for (const it of items) {
    const k = `${it.post_id}|${it.scheduled_at.slice(0, 16)}`;
    let g = m.get(k);
    if (!g) {
      g = { key: k, when: it.scheduled_at, content: it.content, hasMedia: it.has_media, status: it.status, platforms: [], url: it.url ?? null };
      m.set(k, g);
    }
    if (!g.platforms.includes(it.platform)) g.platforms.push(it.platform);
    if (rank(it.status) > rank(g.status)) g.status = it.status;
    if (!g.url && it.url) g.url = it.url;
  }
  return Array.from(m.values());
}

function PlatformDot({ platform }: { platform: string }) {
  return (
    <span
      className="grid size-[18px] shrink-0 place-items-center rounded-full ring-1 ring-white"
      style={{ background: CAL_PLATFORM_BG[platform] || "#94A3B8" }}
      title={platform}
    >
      <PlatformGlyph code={CAL_GLYPH[platform] || "tw"} size={10} color="#ffffff" />
    </span>
  );
}

function CalendarScreen({ onCompose }: { onCompose: (t: ComposerType, presetDate?: string) => void }) {
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = React.useMemo(() => new Date(), []);
  const [view, setView] = React.useState<"month" | "week">("month");
  const [cursor, setCursor] = React.useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [platform, setPlatform] = React.useState("all");
  const [items, setItems] = React.useState<CalendarItem[]>([]);
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  // Note editor: which day is open + draft text.
  const [noteDay, setNoteDay] = React.useState<Date | null>(null);
  const [noteDraft, setNoteDraft] = React.useState("");
  const [noteSaving, setNoteSaving] = React.useState(false);

  // Grid: 42 days (month) or 7 days (week), starting on the Sunday on/before the anchor.
  const gridStart = React.useMemo(() => {
    const base = view === "month" ? new Date(cursor.getFullYear(), cursor.getMonth(), 1) : cursor;
    const s = new Date(base);
    s.setDate(base.getDate() - base.getDay());
    return s;
  }, [cursor, view]);
  const span = view === "month" ? 42 : 7;
  const gridDays = React.useMemo(
    () => Array.from({ length: span }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    }),
    [gridStart, span]
  );

  const reloadNotes = React.useCallback(() => {
    const end = new Date(gridStart);
    end.setDate(gridStart.getDate() + span - 1);
    scheduleApi
      .notes(ymd(gridStart), ymd(end))
      .then((rows) => setNotes(Object.fromEntries(rows.map((n) => [n.note_date, n.content]))))
      .catch(() => setNotes({}));
  }, [gridStart, span]);

  React.useEffect(() => {
    const end = new Date(gridStart);
    end.setDate(gridStart.getDate() + span);
    setLoading(true);
    scheduleApi
      .calendar(gridStart.toISOString(), end.toISOString())
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    reloadNotes();
  }, [gridStart, span, reloadNotes]);

  function openNote(day: Date) {
    setNoteDay(day);
    setNoteDraft(notes[ymd(day)] ?? "");
  }
  async function saveNote() {
    if (!noteDay) return;
    const key = ymd(noteDay);
    const text = noteDraft.trim();
    setNoteSaving(true);
    try {
      if (text) {
        await scheduleApi.upsertNote(key, text);
        setNotes((n) => ({ ...n, [key]: text }));
      } else if (notes[key]) {
        await scheduleApi.deleteNote(key);
        setNotes((n) => { const c = { ...n }; delete c[key]; return c; });
      }
      setNoteDay(null);
    } catch (e) {
      toast.error("Couldn't save note", { description: e instanceof ApiError ? e.message : "Please try again." });
    } finally {
      setNoteSaving(false);
    }
  }
  async function removeNote() {
    if (!noteDay) return;
    const key = ymd(noteDay);
    setNoteSaving(true);
    try {
      await scheduleApi.deleteNote(key);
      setNotes((n) => { const c = { ...n }; delete c[key]; return c; });
      setNoteDay(null);
    } catch {
      toast.error("Couldn't delete note");
    } finally {
      setNoteSaving(false);
    }
  }
  function createForDay(day: Date) {
    onCompose("image", presetDateTime(day));
  }

  const availablePlatforms = React.useMemo(
    () => Array.from(new Set(items.map((i) => i.platform))),
    [items]
  );

  const byDay = React.useMemo(() => {
    const filtered = platform === "all" ? items : items.filter((i) => i.platform === platform);
    const m = new Map<string, CalGroup[]>();
    for (const g of groupItems(filtered)) {
      const k = dayKey(new Date(g.when));
      (m.get(k) ?? m.set(k, []).get(k)!).push(g);
    }
    for (const list of m.values()) list.sort((a, b) => a.when.localeCompare(b.when));
    return m;
  }, [items, platform]);

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const shift = (delta: number) =>
    setCursor((c) =>
      view === "month"
        ? new Date(c.getFullYear(), c.getMonth() + delta, 1)
        : new Date(c.getFullYear(), c.getMonth(), c.getDate() + delta * 7)
    );

  const weekEnd = gridDays[6];
  const label =
    view === "month"
      ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
      : gridStart.getMonth() === weekEnd.getMonth()
        ? `${MONTHS[gridStart.getMonth()].slice(0, 3)} ${gridStart.getDate()} – ${weekEnd.getDate()}`
        : `${MONTHS[gridStart.getMonth()].slice(0, 3)} ${gridStart.getDate()} – ${MONTHS[weekEnd.getMonth()].slice(0, 3)} ${weekEnd.getDate()}`;
  const maxPerCell = view === "month" ? 3 : 8;

  return (
    <div>
      <div className="mb-[22px] flex flex-wrap items-center justify-between gap-3.5">
        <h1 className={h1}>Calendar</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => shift(-1)} className="grid size-8 place-items-center rounded-lg border border-[#E5E7EB] bg-white text-[#334155] hover:bg-[#F8FAFC]"><ChevronLeft className="size-4" /></button>
          <span className="min-w-[150px] text-center text-[15px] font-bold text-[#0F172A]">{label}</span>
          <button onClick={() => shift(1)} className="grid size-8 place-items-center rounded-lg border border-[#E5E7EB] bg-white text-[#334155] hover:bg-[#F8FAFC]"><ChevronRight className="size-4" /></button>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="size-4 animate-spin text-[#94A3B8]" />}
          <button
            onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), today.getDate()))}
            className="rounded-[9px] border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#334155] hover:bg-[#F8FAFC]"
          >
            Today
          </button>
          <div className="relative">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="appearance-none rounded-[9px] border border-[#E5E7EB] bg-white py-2 pl-3.5 pr-8 text-[13px] font-semibold text-[#334155] hover:bg-[#F8FAFC]"
            >
              <option value="all">All Platforms</option>
              {availablePlatforms.map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
            <ChevronDownIcon />
          </div>
          <div className="flex overflow-hidden rounded-[9px] border border-[#E5E7EB]">
            <button
              onClick={() => setView("month")}
              className={"px-3.5 py-2 text-[13px] font-bold " + (view === "month" ? "bg-brand-gradient text-white" : "bg-white text-[#334155]")}
            >
              Month
            </button>
            <button
              onClick={() => setView("week")}
              className={"px-3.5 py-2 text-[13px] font-bold " + (view === "week" ? "bg-brand-gradient text-white" : "bg-white text-[#334155]")}
            >
              Week
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white">
        <div className="grid grid-cols-7 border-b border-[#EEF2F6] bg-[#F8FAFC]">
          {weekdays.map((d) => (
            <div key={d} className="p-3 text-center text-[13px] font-bold text-[#64748B]">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {gridDays.map((d, i) => {
            const inMonth = view === "week" || d.getMonth() === cursor.getMonth();
            const isToday = dayKey(d) === dayKey(today);
            const groups = byDay.get(dayKey(d)) ?? [];
            return (
              <div
                key={i}
                className={(view === "week" ? "min-h-[320px] " : "min-h-[108px] ") + "group relative border-b border-r border-[#F1F5F9] px-[9px] py-2"}
                style={{ background: isToday ? "#F0FDF4" : "#fff" }}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[12px] font-bold" style={{ color: !inMonth ? "#CBD5E1" : isToday ? "#16A34A" : "#64748B" }}>
                    {d.getDate()}{d.getDate() === 1 ? ` ${MONTHS[d.getMonth()].slice(0, 3)}` : ""}
                  </span>
                  <span className="flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    <button onClick={() => openNote(d)} title="Add note" aria-label="Add note" className="grid size-[22px] place-items-center rounded-md border border-[#FCD34D] bg-[#FEF9C3] text-[#B45309] hover:bg-[#FDE68A]">
                      <Pencil className="size-3.5" />
                    </button>
                    <button onClick={() => createForDay(d)} title="Create post for this date" aria-label="Create post for this date" className="grid size-[22px] place-items-center rounded-md border border-[#86EFAC] bg-[#DCFCE7] text-[#16A34A] hover:bg-[#BBF7D0]">
                      <Plus className="size-3.5" />
                    </button>
                  </span>
                </div>
                {notes[ymd(d)] && (
                  <button
                    onClick={() => openNote(d)}
                    className="mb-[5px] flex w-full items-start gap-1 rounded-[6px] border border-[#FDE68A] bg-[#FEFCE8] px-[6px] py-[4px] text-left text-[10px] text-[#854D0E] hover:bg-[#FEF9C3]"
                    title={notes[ymd(d)]}
                  >
                    <span>📝</span>
                    <span className={view === "week" ? "" : "truncate"}>{notes[ymd(d)]}</span>
                  </button>
                )}
                {groups.length === 0 ? (
                  <div className="mt-[14px] text-center text-[11px] text-[#CBD5E1]">No posts</div>
                ) : (
                  <>
                    {groups.slice(0, maxPerCell).map((g) => {
                      const c = CAL_STATUS[g.status] ?? CAL_STATUS.scheduled;
                      const inner = (
                        <>
                          <div className="mb-1 flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold" style={{ color: c.text }}>{fmtTime(g.when)}</span>
                            <span className="flex items-center">
                              {g.platforms.slice(0, 3).map((p, idx) => (
                                <span key={p} className={idx > 0 ? "-ml-1.5" : ""}><PlatformDot platform={p} /></span>
                              ))}
                              {g.platforms.length > 3 && <span className="ml-0.5 text-[9px] font-bold text-[#94A3B8]">+{g.platforms.length - 3}</span>}
                            </span>
                          </div>
                          <div className="truncate text-[10.5px] text-[#475569]">{g.hasMedia ? "🖼 " : ""}{g.content || "(no caption)"}</div>
                        </>
                      );
                      return g.url ? (
                        <a key={g.key} href={g.url} target="_blank" rel="noreferrer" className="mb-[5px] block rounded-[7px] border px-[7px] py-[5px] transition-colors hover:brightness-95" style={{ borderColor: c.border, background: c.bg }}>{inner}</a>
                      ) : (
                        <div key={g.key} className="mb-[5px] rounded-[7px] border px-[7px] py-[5px]" style={{ borderColor: c.border, background: c.bg }} title={g.content}>{inner}</div>
                      );
                    })}
                    {groups.length > maxPerCell && <div className="text-[10px] font-semibold text-[#94A3B8]">+{groups.length - maxPerCell} more</div>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-[12px] text-[#94A3B8]">
        Posts you scheduled or published, on their dates. Blue = scheduled · green = published · red = failed. Hover a day to add a note or create a post.
      </p>

      {noteDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !noteSaving && setNoteDay(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-[420px] rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 text-[16px] font-extrabold text-[#0F172A]">Note</div>
            <div className="mb-3 text-[13px] text-[#64748B]">
              {noteDay.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </div>
            <textarea
              autoFocus
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Jot a reminder for this day…"
              rows={4}
              className="mb-4 w-full resize-y rounded-xl border border-[#E5E7EB] bg-white p-3 text-[14px] text-[#0F172A] outline-none focus:border-[#86EFAC]"
            />
            <div className="flex items-center justify-between gap-2">
              <div>
                {notes[ymd(noteDay)] && (
                  <button onClick={removeNote} disabled={noteSaving} className="rounded-xl border border-[#FEE2E2] bg-white px-3.5 py-2.5 text-[13.5px] font-bold text-[#DC2626] hover:bg-[#FEF2F2] disabled:opacity-60">
                    Delete
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setNoteDay(null)} disabled={noteSaving} className="rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-[13.5px] font-bold text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-60">
                  Cancel
                </button>
                <button onClick={saveNote} disabled={noteSaving} className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60">
                  {noteSaving && <Loader2 className="size-4 animate-spin" />} Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#94A3B8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Posts list (all / posted / scheduled / drafts) — real data                 */
/* -------------------------------------------------------------------------- */
const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  draft: { label: "draft", bg: "#F1F5F9", color: "#64748B" },
  scheduled: { label: "scheduled", bg: "#DBEAFE", color: "#2563EB" },
  publishing: { label: "publishing", bg: "#FEF3C7", color: "#B45309" },
  published: { label: "posted", bg: "#22C55E", color: "#ffffff" },
  failed: { label: "failed", bg: "#FEE2E2", color: "#DC2626" },
  archived: { label: "archived", bg: "#F1F5F9", color: "#94A3B8" },
};

function PostsListScreen({
  title,
  status,
  emptyTitle,
  emptySub,
  onNavigate,
}: {
  title: string;
  status?: PostStatus;
  emptyTitle: string;
  emptySub: string;
  onNavigate: (k: ScreenKey) => void;
}) {
  const [posts, setPosts] = React.useState<Post[] | null>(null);

  const load = React.useCallback(() => {
    setPosts(null);
    postsApi
      .list(status)
      .then((r) => setPosts(r.items))
      .catch(() => setPosts([]));
  }, [status]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (posts === null) {
    return (
      <div>
        <h1 className={`${h1} mb-5`}>{title}</h1>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-1 w-40 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-1/2 animate-marquee rounded-full bg-brand-gradient" />
          </div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h2 className="mb-3.5 text-[44px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#0F172A]">{emptyTitle}</h2>
        <p className="mb-[26px] text-[16px] text-[#64748B]">{emptySub}</p>
        <button
          onClick={() => onNavigate("create")}
          className="db-btn rounded-[11px] bg-brand-gradient px-[26px] py-[13px] text-[15px] font-bold text-white"
          style={{ boxShadow: "0 10px 22px rgba(34,197,94,0.28)" }}
        >
          Create Post
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className={h1}>{title}</h1>
        <button onClick={load} className="grid size-9 place-items-center rounded-[9px] border border-[#E5E7EB] bg-white text-[#64748B]">
          <RefreshCw className="size-4" strokeWidth={2} />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-2">
        {posts.map((p) => {
          const b = STATUS_BADGE[p.status] ?? STATUS_BADGE.draft;
          return (
            <div key={p.id} className={`p-5 ${card}`}>
              <div className="mb-2.5 text-[13px] text-[#94A3B8]">
                {new Date(p.created_at).toLocaleString()}
              </div>
              <p className="mb-[18px] line-clamp-3 text-[14px] leading-relaxed text-[#1E293B]">{p.content}</p>
              <div className="flex items-center justify-end">
                <span className="rounded-lg px-3 py-[5px] text-[12px] font-bold" style={{ background: b.bg, color: b.color }}>
                  {b.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Analytics                                                                  */
/* -------------------------------------------------------------------------- */
function AnalyticsScreen() {
  const [data, setData] = React.useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      // Refresh pulls live engagement from the platforms, then returns the summary.
      setData(await analyticsApi.refresh());
    } catch {
      try {
        setData(await analyticsApi.summary());
      } catch {
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => {
    load();
  }, [load]);

  const nf = (n: number) => new Intl.NumberFormat().format(n);
  const metrics = [
    { label: "Posts", value: data ? nf(data.total_posts) : "—", Icon: BadgeCheck },
    { label: "Likes", value: data ? nf(data.total_likes) : "—", Icon: Heart },
    { label: "Comments", value: data ? nf(data.total_comments) : "—", Icon: MessageCircle },
    { label: "Reposts", value: data ? nf(data.total_shares) : "—", Icon: Repeat2 },
    { label: "Engagement", value: data ? nf(data.total_engagement) : "—", Icon: TrendingUp },
  ];
  const hasPosts = (data?.total_posts ?? 0) > 0;

  return (
    <div>
      <div className="mb-[18px] flex items-center justify-between gap-3">
        <h1 className={h1}>Analytics</h1>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <div className="mb-6 flex gap-[22px] border-b border-[#E5E7EB]">
        <span className="border-b-2 border-[#22C55E] pb-3 text-[14.5px] font-bold text-[#16A34A]">Overview</span>
      </div>

      <div className="std-grid mb-[22px] grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {metrics.map((m) => (
          <div key={m.label} className={`p-5 ${card}`}>
            <div className="mb-3.5 flex items-center gap-[7px] text-[13px] font-semibold text-[#64748B]">
              <m.Icon className="size-[15px] text-[#94A3B8]" strokeWidth={2} />
              {m.label}
            </div>
            <div className="text-[30px] font-black tracking-[-0.02em] text-[#0F172A]">{m.value}</div>
          </div>
        ))}
      </div>

      <div className={`p-[22px] ${card}`}>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[15px] font-extrabold text-[#0F172A]">Top Performing Posts</span>
          <span className="text-[12px] text-[#94A3B8]">by likes · comments · reposts</span>
        </div>

        {loading && !data ? (
          <div className="flex items-center justify-center gap-2 py-10 text-[13.5px] text-[#94A3B8]">
            <Loader2 className="size-4 animate-spin" /> Pulling live engagement…
          </div>
        ) : !hasPosts ? (
          <div className="py-10 text-center text-[13.5px] text-[#94A3B8]">
            No published posts yet. Publish a post and its engagement will show up here.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {data!.top_posts.map((p) => {
              const inner = (
                <>
                  <span className="grid size-[42px] shrink-0 place-items-center rounded-[9px] bg-[#1185FE] text-[12px] font-bold text-white">Bsky</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold text-[#1E293B]">{p.content || "(no caption)"}</div>
                    <div className="mt-[3px] text-[12px] text-[#94A3B8]">
                      {p.published_at ? new Date(p.published_at).toLocaleDateString() : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-[18px] text-[13px] font-semibold text-[#64748B]">
                    <span className="inline-flex items-center gap-1"><Heart className="size-3.5" /> {nf(p.likes)}</span>
                    <span className="inline-flex items-center gap-1"><MessageCircle className="size-3.5" /> {nf(p.comments)}</span>
                    <span className="inline-flex items-center gap-1"><Repeat2 className="size-3.5" /> {nf(p.shares)}</span>
                  </div>
                </>
              );
              return p.url ? (
                <a key={p.post_id} href={p.url} target="_blank" rel="noreferrer" className="flex items-center gap-3.5 rounded-xl border border-[#EEF2F6] p-3.5 transition-colors hover:border-[#BAE6FD] hover:bg-[#F8FBFF]">
                  {inner}
                </a>
              ) : (
                <div key={p.post_id} className="flex items-center gap-3.5 rounded-xl border border-[#EEF2F6] p-3.5">{inner}</div>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-3 text-[12px] text-[#94A3B8]">
        Metrics are pulled live from Bluesky (likes, replies, reposts). Bluesky doesn&apos;t expose view/impression counts.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Connections                                                                */
/* -------------------------------------------------------------------------- */
const CONNECT_PLATFORMS = [
  { name: "Instagram", platform: "instagram", code: "ig", bg: "linear-gradient(135deg,#E1306C,#F77737)" },
  { name: "LinkedIn", platform: "linkedin", code: "li", bg: "#0A66C2" },
  { name: "Pinterest", platform: "pinterest", code: "pin", bg: "#E60023" },
  { name: "X / Twitter", platform: "x", code: "tw", bg: "#0F172A" },
  { name: "YouTube", platform: "youtube", code: "yt", bg: "#FF0000" },
  { name: "TikTok", platform: "tiktok", code: "tt", bg: "#0F172A" },
  { name: "Facebook", platform: "facebook", code: "fb", bg: "#1877F2" },
  { name: "Bluesky", platform: "bluesky", code: "bs", bg: "#1185FE" },
  { name: "Mastodon", platform: "mastodon", code: "ma", bg: "#6364FF" },
  { name: "Threads", platform: "threads", code: "th", bg: "#0F172A" },
];

function ConnectionsScreen() {
  const [accounts, setAccounts] = React.useState<SocialAccount[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [bsky, setBsky] = React.useState({ open: false, id: "", pw: "", loading: false });
  const [masto, setMasto] = React.useState({ open: false, instance: "", token: "", loading: false });
  const [confirmDc, setConfirmDc] = React.useState<SocialAccount | null>(null);
  const [dcBusy, setDcBusy] = React.useState(false);

  const load = React.useCallback(() => {
    scheduleApi.accounts().then(setAccounts).catch(() => setAccounts([]));
  }, []);
  React.useEffect(() => load(), [load]);

  async function submitBluesky() {
    if (!bsky.id.trim() || !bsky.pw.trim()) return;
    setBsky((s) => ({ ...s, loading: true }));
    try {
      await scheduleApi.connectBluesky({ identifier: bsky.id.trim(), app_password: bsky.pw.trim() });
      toast.success("Bluesky connected", { description: "You can now post to it from the composer." });
      setBsky({ open: false, id: "", pw: "", loading: false });
      load();
    } catch (e) {
      toast.error("Couldn't connect Bluesky", {
        description: e instanceof ApiError ? e.message : "Check your handle and app password.",
      });
      setBsky((s) => ({ ...s, loading: false }));
    }
  }

  async function submitMastodon() {
    if (!masto.instance.trim() || !masto.token.trim()) return;
    setMasto((s) => ({ ...s, loading: true }));
    try {
      await scheduleApi.connectMastodon({ instance_url: masto.instance.trim(), access_token: masto.token.trim() });
      toast.success("Mastodon connected", { description: "You can now post to it from the composer." });
      setMasto({ open: false, instance: "", token: "", loading: false });
      load();
    } catch (e) {
      toast.error("Couldn't connect Mastodon", {
        description: e instanceof ApiError ? e.message : "Check the instance URL and access token.",
      });
      setMasto((s) => ({ ...s, loading: false }));
    }
  }

  async function connect(platform: string, name: string) {
    if (platform === "bluesky") {
      setBsky({ open: true, id: "", pw: "", loading: false });
      return;
    }
    if (platform === "mastodon") {
      setMasto({ open: true, instance: "", token: "", loading: false });
      return;
    }
    if (platform === "linkedin") {
      // OAuth: full-page redirect to the backend, which sends the user to LinkedIn.
      window.location.href = `${API_URL}/schedule/accounts/linkedin/login`;
      return;
    }
    const handle = window.prompt(`Enter the @handle to connect for ${name}:`)?.trim();
    if (!handle) return;
    setBusy(platform);
    try {
      await scheduleApi.connect({ platform, external_id: crypto.randomUUID(), handle });
      toast.success(`Connected ${name}`, { description: "You can now select it when composing." });
      load();
    } catch (e) {
      toast.error("Couldn't connect", { description: e instanceof ApiError ? e.message : "Please try again." });
    } finally {
      setBusy(null);
    }
  }

  async function doDisconnect() {
    if (!confirmDc) return;
    setDcBusy(true);
    try {
      await scheduleApi.disconnect(confirmDc.id);
      toast.success("Disconnected", { description: `${confirmDc.handle} was removed.` });
      setConfirmDc(null);
      load();
    } catch (e) {
      toast.error("Couldn't disconnect", {
        description: e instanceof ApiError ? e.message : "Please try again.",
      });
    } finally {
      setDcBusy(false);
    }
  }

  return (
    <div>
      <h1 className={`${h1} mb-6`}>Connected Accounts</h1>

      {confirmDc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !dcBusy && setConfirmDc(null)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 text-[18px] font-extrabold text-[#0F172A]">Disconnect account?</div>
            <p className="mb-5 text-[13.5px] leading-relaxed text-[#64748B]">
              <span className="font-semibold text-[#334155]">{confirmDc.handle}</span> will be removed. You won&apos;t
              be able to post to it until you reconnect. Your existing posts stay untouched.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setConfirmDc(null)}
                disabled={dcBusy}
                className="rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#64748B] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={doDisconnect}
                disabled={dcBusy}
                className="flex items-center gap-2 rounded-[10px] bg-[#EF4444] px-5 py-2.5 text-[14px] font-bold text-white hover:bg-[#DC2626] disabled:opacity-60"
              >
                {dcBusy && <Loader2 className="size-4 animate-spin" />} Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {bsky.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setBsky((s) => ({ ...s, open: false }))}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg" style={{ background: "#1185FE" }}>
                <PlatformGlyph code="bs" size={18} color="#fff" />
              </span>
              <span className="text-[18px] font-extrabold text-[#0F172A]">Connect Bluesky</span>
            </div>
            <p className="mb-4 text-[13px] leading-relaxed text-[#64748B]">
              Create an <span className="font-semibold text-[#334155]">app password</span> in Bluesky
              (Settings → Privacy &amp; Security → App Passwords), then paste it here.
            </p>
            <label className="mb-1 block text-[13px] font-semibold text-[#334155]">Handle or email</label>
            <input
              value={bsky.id}
              onChange={(e) => setBsky((s) => ({ ...s, id: e.target.value }))}
              placeholder="yourname.bsky.social"
              className="mb-3 w-full rounded-[10px] border border-[#E2E8F0] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#22C55E]"
            />
            <label className="mb-1 block text-[13px] font-semibold text-[#334155]">App password</label>
            <input
              type="password"
              value={bsky.pw}
              onChange={(e) => setBsky((s) => ({ ...s, pw: e.target.value }))}
              placeholder="xxxx-xxxx-xxxx-xxxx"
              className="mb-5 w-full rounded-[10px] border border-[#E2E8F0] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#22C55E]"
            />
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setBsky((s) => ({ ...s, open: false }))}
                className="rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#64748B]"
              >
                Cancel
              </button>
              <button
                onClick={submitBluesky}
                disabled={bsky.loading}
                className="rounded-[10px] bg-brand-gradient px-5 py-2.5 text-[14px] font-bold text-white disabled:opacity-60"
              >
                {bsky.loading ? "Connecting…" : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}

      {masto.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setMasto((s) => ({ ...s, open: false }))}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg" style={{ background: "#6364FF" }}>
                <PlatformGlyph code="ma" size={18} color="#fff" />
              </span>
              <span className="text-[18px] font-extrabold text-[#0F172A]">Connect Mastodon</span>
            </div>
            <p className="mb-4 text-[13px] leading-relaxed text-[#64748B]">
              On your Mastodon instance go to <span className="font-semibold text-[#334155]">Preferences →
              Development → New application</span> (scopes: <span className="font-semibold text-[#334155]">write</span>),
              then paste the access token here.
            </p>
            <label className="mb-1 block text-[13px] font-semibold text-[#334155]">Instance URL</label>
            <input
              value={masto.instance}
              onChange={(e) => setMasto((s) => ({ ...s, instance: e.target.value }))}
              placeholder="mastodon.social"
              className="mb-3 w-full rounded-[10px] border border-[#E2E8F0] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#6364FF]"
            />
            <label className="mb-1 block text-[13px] font-semibold text-[#334155]">Access token</label>
            <input
              type="password"
              value={masto.token}
              onChange={(e) => setMasto((s) => ({ ...s, token: e.target.value }))}
              placeholder="paste your access token"
              className="mb-5 w-full rounded-[10px] border border-[#E2E8F0] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#6364FF]"
            />
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setMasto((s) => ({ ...s, open: false }))}
                className="rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#64748B]"
              >
                Cancel
              </button>
              <button
                onClick={submitMastodon}
                disabled={masto.loading}
                className="rounded-[10px] bg-brand-gradient px-5 py-2.5 text-[14px] font-bold text-white disabled:opacity-60"
              >
                {masto.loading ? "Connecting…" : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`px-7 py-[26px] ${card}`}>
        <div className="flex flex-col gap-3.5">
          {CONNECT_PLATFORMS.map((p) => {
            const mine = accounts.filter((a) => a.platform === p.platform);
            return (
              <div key={p.name} className="flex flex-wrap items-center gap-4">
                <span className="grid size-[34px] shrink-0 place-items-center rounded-[9px]" style={{ background: p.bg }}>
                  <PlatformGlyph code={p.code} size={18} color="#fff" />
                </span>
                <button
                  onClick={() => connect(p.platform, p.name)}
                  disabled={busy === p.platform}
                  className="min-w-[210px] rounded-[9px] bg-[#0F172A] px-3.5 py-[9px] text-left text-[13px] font-semibold text-white disabled:opacity-60"
                >
                  {busy === p.platform ? "Connecting…" : `Connect ${p.name}`}
                </button>
                <div className="flex flex-wrap gap-2.5">
                  {mine.map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-[7px] rounded-full bg-[#F1F5F9] py-1 pl-1 pr-1.5">
                      <span className="grid size-[22px] place-items-center rounded-full bg-[#CBD5E1] text-[9px] font-bold text-white">
                        {a.handle.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="text-[12.5px] font-semibold text-[#334155]">{a.handle}</span>
                      <button
                        onClick={() => setConfirmDc(a)}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-semibold text-[#EF4444] hover:bg-[#FEE2E2]"
                        aria-label={`Disconnect ${a.handle}`}
                      >
                        <X className="size-3.5" strokeWidth={2.5} /> Disconnect
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Teams                                                                      */
/* -------------------------------------------------------------------------- */
function TeamsScreen({ onNavigate }: { onNavigate: (k: ScreenKey) => void }) {
  return (
    <div>
      <h1 className={`${h1} mb-1`}>Teams</h1>
      <p className="mb-[22px] text-[15px] text-[#64748B]">Collaborate with your team on social media content</p>
      <div className="mb-[26px] flex flex-wrap items-center justify-between gap-5 rounded-[14px] border border-[#BBF7D0] bg-gradient-to-br from-[#DCFCE7] to-[#F0FDF4] px-6 py-5">
        <div>
          <div className="mb-1 text-[16px] font-extrabold text-[#0F172A]">Pro subscription required to create teams</div>
          <div className="text-[13.5px] text-[#166534]">Upgrade to Pro to create your own teams. You can still join teams as a member without Pro!</div>
        </div>
        <button
          onClick={() => onNavigate("billing")}
          className="db-btn whitespace-nowrap rounded-[10px] bg-brand-gradient px-5 py-[11px] text-[14px] font-bold text-white"
        >
          Upgrade to Pro
        </button>
      </div>
      <div className="mb-4 text-[18px] font-extrabold text-[#0F172A]">My Teams</div>
      <div className="rounded-[16px] border border-[#E5E7EB] bg-[#F1F5F9] p-14 text-center">
        <Users className="mx-auto mb-3.5 size-[52px] text-[#CBD5E1]" strokeWidth={1.6} />
        <div className="mb-1.5 text-[19px] font-extrabold text-[#0F172A]">No teams yet</div>
        <div className="text-[14px] text-[#94A3B8]">Upgrade to Pro to create and manage teams</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Settings                                                                   */
/* -------------------------------------------------------------------------- */
function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className="relative inline-block h-[25px] w-11 shrink-0 cursor-pointer rounded-full"
      style={{ background: on ? "#22C55E" : "#CBD5E1" }}
    >
      <span
        className="absolute top-[3px] size-[19px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
        style={{ left: on ? 22 : 3 }}
      />
    </span>
  );
}

function SettingsScreen({ user, onNavigate }: { user: User; onNavigate: (k: ScreenKey) => void }) {
  const prefs = [
    { title: "Automation Emails", desc: "Updates about your scheduled and automated posts", on: true },
    { title: "Product Updates", desc: "New features and improvements to Postly", on: true },
    { title: "Marketing Emails", desc: "Tips, offers and growth guides", on: false },
  ];
  return (
    <div className="max-w-[820px]">
      <h1 className={`${h1} mb-[18px]`}>Settings</h1>
      <div className="mb-7 flex gap-[26px] border-b border-[#E5E7EB]">
        <span className="border-b-2 border-[#22C55E] pb-3 text-[14.5px] font-bold text-[#16A34A]">Settings</span>
        <span className="pb-3 text-[14.5px] font-semibold text-[#94A3B8]">Queue</span>
        <span onClick={() => onNavigate("billing")} className="cursor-pointer pb-3 text-[14.5px] font-semibold text-[#94A3B8]">Billing</span>
        <span className="pb-3 text-[14.5px] font-semibold text-[#94A3B8]">Plans</span>
      </div>

      <div className={`mb-[22px] px-7 py-[26px] ${card}`}>
        <div className="mb-[22px] text-[19px] font-extrabold text-[#0F172A]">Profile</div>
        <div className="flex flex-wrap items-start gap-[22px]">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#DCFCE7] text-[20px] font-extrabold text-[#16A34A]">
            {(user.name[0] || "H").toUpperCase()}
          </span>
          <div className="min-w-[260px] flex-1">
            <label className="mb-[7px] block text-[13px] font-semibold text-[#64748B]">Display Name</label>
            <div className="flex gap-3">
              <input defaultValue={user.name} className="flex-1 rounded-[10px] border border-[#E2E8F0] px-3.5 py-[11px] text-[14.5px] text-[#0F172A] outline-none" />
              <button className="rounded-[10px] bg-[#E5E7EB] px-[22px] py-[11px] text-[14px] font-bold text-[#94A3B8]">Save</button>
            </div>
            <div className="mt-2 text-[12.5px] text-[#94A3B8]">This name will be displayed across the platform</div>
            <label className="mb-1.5 mt-[22px] block text-[13px] font-semibold text-[#64748B]">Email Address</label>
            <div className="text-[14.5px] font-medium text-[#334155]">{user.email}</div>
          </div>
        </div>
      </div>

      <div className={`mb-[22px] px-7 py-[26px] ${card}`}>
        <div className="mb-[18px] text-[19px] font-extrabold text-[#0F172A]">Email Address</div>
        <div className="mb-[5px] text-[13px] font-semibold text-[#64748B]">Current Email</div>
        <div className="mb-4 text-[14.5px] font-medium text-[#334155]">{user.email}</div>
        <button className="w-full rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] py-3 text-[14px] font-bold text-[#334155] hover:bg-[#F1F5F9]">Change Email Address</button>
        <div className="mb-4 mt-[26px] text-[19px] font-extrabold text-[#0F172A]">Password</div>
        <button className="mb-3.5 w-full rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] py-3 text-[14px] font-bold text-[#334155] hover:bg-[#F1F5F9]">Change Password</button>
        <div className="text-center text-[13.5px] text-[#64748B]">Forgot Password? <a href="#" className="font-semibold text-[#16A34A]">Send Reset Link</a></div>
      </div>

      <div className={`mb-[22px] px-7 py-[26px] ${card}`}>
        <div className="mb-2 text-[19px] font-extrabold text-[#0F172A]">Security</div>
        <p className="mb-4 text-[13.5px] leading-relaxed text-[#64748B]">Sign out of all devices and sessions. You will need to log in again everywhere.</p>
        <button className="w-full rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] py-3 text-[14px] font-bold text-[#DC2626] hover:bg-[#FEE2E2]">Sign Out All Devices</button>
      </div>

      <div className={`px-7 py-[26px] ${card}`}>
        <div className="mb-[18px] text-[19px] font-extrabold text-[#0F172A]">Email Preferences</div>
        {prefs.map((p) => (
          <div key={p.title} className="flex items-center justify-between gap-4 border-b border-[#F1F5F9] py-3.5 last:border-0">
            <div>
              <div className="text-[14.5px] font-bold text-[#0F172A]">{p.title}</div>
              <div className="mt-[3px] text-[13px] text-[#94A3B8]">{p.desc}</div>
            </div>
            <Toggle on={p.on} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Generic (api keys / billing)                                               */
/* -------------------------------------------------------------------------- */
function GenericScreen({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="mb-[18px] grid size-[66px] place-items-center rounded-[16px] border border-[#E5E7EB] bg-white text-[#94A3B8]">
        <Package className="size-[30px]" strokeWidth={1.8} />
      </span>
      <h2 className="mb-2 text-[30px] font-extrabold text-[#0F172A]">{title}</h2>
      <p className="text-[15px] text-[#64748B]">This section is part of the Postly dashboard.</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Router                                                                      */
/* -------------------------------------------------------------------------- */
export function DashboardScreen({
  active,
  user,
  onNavigate,
  onCompose,
}: {
  active: ScreenKey;
  user: User;
  onNavigate: (k: ScreenKey) => void;
  onCompose: (t: ComposerType, presetDate?: string) => void;
}) {
  switch (active) {
    case "create":
      return <CreateScreen onCompose={onCompose} onNavigate={onNavigate} />;
    case "studio":
      return <StudioScreen />;
    case "bulk":
      return <BulkScreen />;
    case "calendar":
      return <CalendarScreen onCompose={onCompose} />;
    case "all":
      return <PostsListScreen title="All Posts" emptyTitle="No posts yet" emptySub="Create your first post to see it here." onNavigate={onNavigate} />;
    case "posted":
      return <PostsListScreen title="Posted" status="published" emptyTitle="No posted content yet" emptySub="Once you publish, your posts show up here." onNavigate={onNavigate} />;
    case "scheduled":
      return <PostsListScreen title="Scheduled" status="scheduled" emptyTitle="No scheduled posts" emptySub="Schedule a post and it will show up here." onNavigate={onNavigate} />;
    case "drafts":
      return <PostsListScreen title="Drafts" status="draft" emptyTitle="No drafts yet" emptySub="Save a post as a draft and it will show up here." onNavigate={onNavigate} />;
    case "analytics":
      return <AnalyticsScreen />;
    case "connections":
      return <ConnectionsScreen />;
    case "teams":
      return <TeamsScreen onNavigate={onNavigate} />;
    case "settings":
      return <SettingsScreen user={user} onNavigate={onNavigate} />;
    case "apikeys":
      return <GenericScreen title="API Keys" />;
    case "billing":
      return <GenericScreen title="Billing" />;
    default:
      return null;
  }
}
