"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { DashboardSidebar, type ScreenKey } from "@/components/dashboard/sidebar";
import { DashboardScreen } from "@/components/dashboard/screens";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [active, setActive] = React.useState<ScreenKey>("create");
  const [drawer, setDrawer] = React.useState(false);

  // Real user when authenticated; sensible fallbacks so the shell always renders.
  const displayUser = {
    name: user?.name ?? "hhgsoftechteam1",
    email: user?.email ?? "hhgsoftechteam1@gmail.com",
  };

  const navigate = React.useCallback((k: ScreenKey) => {
    setActive(k);
    setDrawer(false);
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  const sidebar = (
    <DashboardSidebar
      active={active}
      onNavigate={navigate}
      userName={displayUser.name}
      plan="Creator Plan"
      onLogout={handleLogout}
    />
  );

  return (
    <div className="grid h-dvh grid-cols-1 overflow-hidden bg-[#F3F4F6] lg:grid-cols-[248px_1fr]">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">{sidebar}</div>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="absolute left-0 top-0 h-full w-[248px] shadow-2xl">{sidebar}</div>
        </div>
      )}

      {/* Main */}
      <main className="db-scroll h-dvh overflow-y-auto">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#EEF2F6] bg-white px-4 py-3 lg:hidden">
          <span className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-[9px] bg-brand-gradient">
              <svg width="17" height="17" viewBox="0 0 24 24">
                <path d="M3 11.5L21 3l-8.5 18-2.4-7.1L3 11.5z" fill="#fff" />
              </svg>
            </span>
            <span className="text-[17px] font-extrabold text-[#0F172A]">postly</span>
          </span>
          <button
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
            className="grid size-9 place-items-center rounded-lg text-[#334155] hover:bg-slate-100"
          >
            <Menu className="size-5" />
          </button>
        </div>

        <div className="mx-auto max-w-[1520px] px-6 py-8 lg:px-11 lg:py-[38px]">
          <DashboardScreen active={active} user={displayUser} onNavigate={navigate} />
        </div>
      </main>
    </div>
  );
}
