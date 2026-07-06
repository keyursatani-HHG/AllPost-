"use client";

import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronsUpDown,
  FileText,
  Layers,
  Link2,
  List,
  Pencil,
  Settings,
  Sparkles,
  Timer,
  Users,
  type LucideIcon,
} from "lucide-react";

export type ScreenKey =
  | "create"
  | "studio"
  | "bulk"
  | "calendar"
  | "all"
  | "scheduled"
  | "posted"
  | "drafts"
  | "analytics"
  | "connections"
  | "teams"
  | "settings"
  | "apikeys"
  | "billing";

type NavItem = { key: ScreenKey; label: string; Icon: LucideIcon };

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Create",
    items: [
      { key: "create", label: "New post", Icon: FileText },
      { key: "studio", label: "Studio", Icon: Sparkles },
      { key: "bulk", label: "Bulk tools", Icon: Layers },
    ],
  },
  {
    title: "Posts",
    items: [
      { key: "calendar", label: "Calendar", Icon: Calendar },
      { key: "all", label: "All", Icon: List },
      { key: "scheduled", label: "Scheduled", Icon: Timer },
      { key: "posted", label: "Posted", Icon: CheckCircle2 },
      { key: "drafts", label: "Drafts", Icon: Pencil },
      { key: "analytics", label: "Analytics", Icon: BarChart3 },
    ],
  },
  {
    title: "Workspace",
    items: [
      { key: "connections", label: "Connections", Icon: Link2 },
      { key: "teams", label: "Teams", Icon: Users },
    ],
  },
  {
    title: "Configuration",
    items: [
      { key: "settings", label: "Settings", Icon: Settings },
    ],
  },
];

export function DashboardSidebar({
  active,
  onNavigate,
  userName,
  plan,
  onLogout,
}: {
  active: ScreenKey;
  onNavigate: (key: ScreenKey) => void;
  userName: string;
  plan: string;
  onLogout: () => void;
}) {
  const initial = (userName[0] || "A").toUpperCase();

  return (
    <aside className="db-scroll flex h-dvh flex-col overflow-y-auto border-r border-[#EEF2F6] bg-white">
      {/* Logo */}
      <div className="px-[18px] pb-3 pt-[18px]">
        <button
          onClick={() => onNavigate("create")}
          className="flex items-center gap-2.5"
        >
          <span
            className="grid size-8 place-items-center rounded-[9px] bg-brand-gradient"
            style={{ boxShadow: "0 5px 14px rgba(34,197,94,0.30)" }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M3 11.5L21 3l-8.5 18-2.4-7.1L3 11.5z" fill="#fff" />
            </svg>
          </span>
          <span className="text-[17px] font-extrabold tracking-tight text-[#0F172A]">
            postly
          </span>
        </button>
      </div>

      {/* Nav groups */}
      {GROUPS.map((group) => (
        <div key={group.title} className="px-[14px] pb-1">
          <div className="px-1 pb-1.5 pt-2 text-[11px] font-bold tracking-wide text-[#94A3B8]">
            {group.title}
          </div>
          {group.items.map((item) => {
            const on = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className="nav-item flex w-full items-center gap-[11px] rounded-[10px] px-[11px] py-[9px] text-left text-[13.5px] font-semibold transition-colors"
                style={{
                  background: on ? "#F0FDF4" : "transparent",
                  color: on ? "#16A34A" : "#475569",
                }}
              >
                <item.Icon className="size-[17px]" strokeWidth={1.9} />
                {item.label}
              </button>
            );
          })}
        </div>
      ))}

      {/* Account */}
      <div className="mt-auto border-t border-[#EEF2F6] px-[14px] py-3">
        <button
          onClick={onLogout}
          title="Log out"
          className="nav-item flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[#DCFCE7] text-[14px] font-extrabold text-[#16A34A]">
            {initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-bold text-[#334155]">
              {userName}
            </span>
            <span className="block text-[11.5px] text-[#94A3B8]">{plan}</span>
          </span>
          <ChevronsUpDown className="size-3.5 text-[#94A3B8]" strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}
