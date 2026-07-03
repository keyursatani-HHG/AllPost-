"use client";

import * as React from "react";
import {
  Activity,
  AlignLeft,
  BadgeCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
  Eye,
  Grid2x2,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Mic,
  Package,
  RefreshCw,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";

import { postsApi } from "@/lib/api";
import type { Post, PostStatus } from "@/types";
import { PlatformGlyph, PlatformRow } from "@/components/dashboard/icons";
import type { ScreenKey } from "@/components/dashboard/sidebar";
import type { ComposerType } from "@/components/dashboard/composer";

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
  onCompose: (t: ComposerType) => void;
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
  const cards = [
    { title: "2×2 Grid Video", desc: "Create viral videos with this 4 image grid format (tested & proven).", views: "20M+ views", Icon: Grid2x2 },
    { title: "Single Fade-in Video", desc: "Simple format with billions of views — use your imagination to make a viral banger (we'll do the editing).", views: "500M+ views", Icon: ImageIcon },
    { title: "AI UGC Creator", desc: "Create authentic UGC-style videos in seconds using our AI-powered templates. Perfect for demos and viral content.", views: "1B+ views", Icon: Mic },
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
            <div className="mb-2 text-[18px] font-extrabold text-[#0F172A]">{c.title}</div>
            <p className="mb-4 flex-1 text-[14px] leading-relaxed text-[#64748B]">{c.desc}</p>
            <div className="mb-[18px] flex items-center gap-4 text-[13px] font-bold text-[#16A34A]">
              <span>🔥 Trending</span>
              <span className="font-semibold text-[#64748B]">📊 {c.views}</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="db-btn rounded-[10px] bg-brand-gradient px-[18px] py-2.5 text-[13.5px] font-bold text-white">
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
  const cards = [
    { title: "Bulk Video Upload", desc: "Upload and schedule multiple videos at once.", codes: ["fb", "ig", "li", "pin", "tt", "tw", "th", "yt"] },
    { title: "Bulk Image Upload", desc: "Upload and schedule multiple images at once.", codes: ["fb", "ig", "li", "pin", "tt", "tw", "th", "bs"] },
    { title: "Bulk Video Creation", desc: "Create viral 2×2 grid videos in bulk (AI assisted).", codes: [] },
  ];
  return (
    <div>
      <h1 className={`${h1} mb-[26px]`}>Bulk tools</h1>
      <div className="bulk-grid grid grid-cols-1 gap-[22px] md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className={`std-card px-6 pb-6 pt-[34px] text-center transition-all ${card}`}>
            <div className="mb-[18px] flex justify-center gap-1.5 text-[#CBD5E1]">
              <Package className="size-7" strokeWidth={1.6} />
              <Video className="size-7" strokeWidth={1.6} />
            </div>
            <div className="mb-4 flex items-center justify-center gap-2">
              <span className="text-[18px] font-extrabold text-[#0F172A]">{c.title}</span>
              <span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-extrabold text-[#64748B]">NEW</span>
            </div>
            <p className="mb-[18px] text-[13.5px] leading-normal text-[#94A3B8]">{c.desc}</p>
            {c.codes.length > 0 && <PlatformRow codes={c.codes} size={15} color="#CBD5E1" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Calendar                                                                   */
/* -------------------------------------------------------------------------- */
function CalendarScreen() {
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const cells: { date: string; muted: boolean }[] = [
    { date: "Jun 28", muted: true }, { date: "Jun 29", muted: true }, { date: "Jun 30", muted: true },
    ...Array.from({ length: 31 }, (_, i) => ({ date: `Jul ${i + 1}`, muted: false })),
    { date: "Aug 1", muted: true },
  ];
  return (
    <div>
      <div className="mb-[22px] flex flex-wrap items-center justify-between gap-3.5">
        <h1 className={h1}>Calendar</h1>
        <div className="flex items-center gap-4">
          <button className="grid size-8 place-items-center rounded-lg border border-[#E5E7EB] bg-white text-[#334155]"><ChevronLeft className="size-4" /></button>
          <span className="text-[15px] font-bold text-[#0F172A]">July 2026</span>
          <button className="grid size-8 place-items-center rounded-lg border border-[#E5E7EB] bg-white text-[#334155]"><ChevronRight className="size-4" /></button>
        </div>
        <div className="flex gap-2">
          <button className="rounded-[9px] border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#334155]">All Platforms ▾</button>
          <button className="rounded-[9px] bg-brand-gradient px-3.5 py-2 text-[13px] font-bold text-white">Month</button>
          <button className="rounded-[9px] border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#334155]">Week</button>
        </div>
      </div>
      <div className="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white">
        <div className="grid grid-cols-7 border-b border-[#EEF2F6] bg-[#F8FAFC]">
          {weekdays.map((d) => (
            <div key={d} className="p-3 text-center text-[13px] font-bold text-[#64748B]">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((c, i) => {
            const isJul2 = c.date === "Jul 2";
            const isJul3 = c.date === "Jul 3";
            return (
              <div
                key={i}
                className="min-h-[96px] border-b border-r border-[#F1F5F9] px-[9px] py-2"
                style={{ background: isJul3 ? "#F0FDF4" : "#fff" }}
              >
                <div
                  className="mb-1.5 text-[12px] font-bold"
                  style={{ color: c.muted ? "#CBD5E1" : isJul3 ? "#16A34A" : "#64748B" }}
                >
                  {c.date}
                </div>
                {isJul2 ? (
                  <>
                    {["2:20 PM", "2:30 PM"].map((t, j) => (
                      <div key={t} className={`rounded-[7px] border border-[#DCFCE7] bg-[#F0FDF4] px-[7px] py-[5px] ${j === 0 ? "mb-[5px]" : ""}`}>
                        <div className="mb-0.5 text-[10px] font-bold text-[#16A34A]">{t}</div>
                        <div className="truncate text-[10px] text-[#475569]">🚨 Crypto market update…</div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="mt-[22px] text-center text-[11px] text-[#CBD5E1]">No posts</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
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
  const metrics = [
    { label: "Views", value: "0", Icon: Eye },
    { label: "Likes", value: "0", Icon: Heart },
    { label: "Comments", value: "0", Icon: MessageCircle },
    { label: "Avg views / post", value: "0", Icon: TrendingUp },
    { label: "Engagement rate", value: "0.00%", Icon: Activity },
  ];
  return (
    <div>
      <h1 className={`${h1} mb-[18px]`}>Analytics</h1>
      <div className="mb-6 flex gap-[22px] border-b border-[#E5E7EB]">
        <span className="border-b-2 border-[#22C55E] pb-3 text-[14.5px] font-bold text-[#16A34A]">Overview</span>
        <span className="pb-3 text-[14.5px] font-semibold text-[#94A3B8]">Posts</span>
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
        <div className="mb-4 text-[15px] font-extrabold text-[#0F172A]">Top Performing Posts</div>
        <div className="flex items-center gap-3.5 rounded-xl border border-[#EEF2F6] p-3.5">
          <span className="size-[42px] shrink-0 rounded-[9px]" style={{ background: "linear-gradient(135deg,#E1306C,#F77737)" }} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-semibold text-[#1E293B]">🚨 JUST IN: JAPAN&apos;S METAPLANET NOW HOL…</div>
            <div className="mt-[3px] text-[12px] text-[#94A3B8]">📷 2/7/2026</div>
          </div>
          <div className="flex gap-[18px] text-[13px] font-semibold text-[#94A3B8]">
            <span>👁 0</span><span>♡ 0</span><span>% 0.00%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Connections                                                                */
/* -------------------------------------------------------------------------- */
function ConnectionsScreen() {
  const conn: {
    name: string;
    code: string;
    bg: string;
    accounts: { t: string; i?: string; ic?: string }[];
  }[] = [
    { name: "Instagram", code: "ig", bg: "linear-gradient(135deg,#E1306C,#F77737)", accounts: [{ t: "hhgsoftechteam1" }] },
    { name: "Linkedin", code: "li", bg: "#0A66C2", accounts: [{ t: "HHG Team1", i: "H", ic: "#EC4899" }] },
    { name: "Pinterest", code: "pin", bg: "#E60023", accounts: [{ t: "hhgsoftechteam1" }] },
    { name: "Twitter", code: "tw", bg: "#0F172A", accounts: [{ t: "Hirendevani_" }, { t: "HirenDevani10" }] },
    { name: "Youtube", code: "yt", bg: "#FF0000", accounts: [] },
    { name: "Tiktok", code: "tt", bg: "#0F172A", accounts: [] },
    { name: "Facebook", code: "fb", bg: "#1877F2", accounts: [] },
    { name: "Bluesky", code: "bs", bg: "#1185FE", accounts: [] },
    { name: "Threads", code: "th", bg: "#0F172A", accounts: [] },
    { name: "Google Business", code: "gb", bg: "#4285F4", accounts: [] },
  ];
  return (
    <div>
      <h1 className={`${h1} mb-6`}>Connected Accounts</h1>
      <div className={`px-7 py-[26px] ${card}`}>
        <div className="flex flex-col gap-3.5">
          {conn.map((c) => (
            <div key={c.name} className="flex flex-wrap items-center gap-4">
              <span className="grid size-[34px] shrink-0 place-items-center rounded-[9px]" style={{ background: c.bg }}>
                <PlatformGlyph code={c.code} size={18} color="#fff" />
              </span>
              <button className="min-w-[210px] rounded-[9px] bg-[#0F172A] px-3.5 py-[9px] text-left text-[13px] font-semibold text-white">
                Connect {c.name}
              </button>
              <div className="flex flex-wrap gap-2.5">
                {c.accounts.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-[7px] rounded-full bg-[#F1F5F9] py-1 pl-1 pr-2.5">
                    <span className="grid size-[22px] place-items-center rounded-full text-[9px] font-bold text-white" style={{ background: a.ic || "#CBD5E1" }}>
                      {a.i || a.t.slice(0, 2)}
                    </span>
                    <span className="text-[12.5px] font-semibold text-[#334155]">{a.t}</span>
                    <span className="cursor-pointer text-[13px] text-[#EF4444]">×</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
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
  onCompose: (t: ComposerType) => void;
}) {
  switch (active) {
    case "create":
      return <CreateScreen onCompose={onCompose} onNavigate={onNavigate} />;
    case "studio":
      return <StudioScreen />;
    case "bulk":
      return <BulkScreen />;
    case "calendar":
      return <CalendarScreen />;
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
