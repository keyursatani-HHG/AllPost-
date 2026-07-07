"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Menu } from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { DashboardSidebar, type ScreenKey } from "@/components/dashboard/sidebar";
import { DashboardScreen } from "@/components/dashboard/screens";
import { Composer, type ComposerType } from "@/components/dashboard/composer";

export default function DashboardPage() {
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const [active, setActive] = React.useState<ScreenKey>("create");
  const [drawer, setDrawer] = React.useState(false);
  const [composer, setComposer] = React.useState<ComposerType | null>(null);
  const [composerDate, setComposerDate] = React.useState<string | undefined>(undefined);

  // Protected route: send unauthenticated visitors to login once auth resolves.
  React.useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?from=/dashboard");
  }, [status, router]);

  // Surface the result of the LinkedIn OAuth redirect (?linkedin=...).
  React.useEffect(() => {
    const li = new URLSearchParams(window.location.search).get("linkedin");
    if (!li) return;
    const M: Record<string, { ok: boolean; msg: string; desc?: string }> = {
      connected: { ok: true, msg: "LinkedIn connected", desc: "You can now post to it from the composer." },
      not_configured: { ok: false, msg: "LinkedIn isn't set up yet", desc: "The LinkedIn app credentials aren't configured on the server." },
      auth_required: { ok: false, msg: "Please sign in again", desc: "Your session expired before connecting." },
      state: { ok: false, msg: "Couldn't connect LinkedIn", desc: "Security check failed — please try again." },
      failed: { ok: false, msg: "Couldn't connect LinkedIn", desc: "Authorization failed — please try again." },
    };
    const m = M[li];
    if (m) (m.ok ? toast.success : toast.error)(m.msg, { description: m.desc });
    if (li === "connected") setActive("connections");
    window.history.replaceState({}, "", "/dashboard");
  }, []);

  const navigate = React.useCallback((k: ScreenKey) => {
    setActive(k);
    setDrawer(false);
    setComposer(null);
    setComposerDate(undefined);
  }, []);

  const openComposer = React.useCallback((t: ComposerType, presetDate?: string) => {
    setComposer(t);
    setComposerDate(presetDate);
  }, []);

  // While the session is resolving (or redirecting), show a lightweight loader.
  if (status !== "authenticated" || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F3F4F6]">
        <div className="h-1 w-40 overflow-hidden rounded-full bg-slate-200" role="status" aria-label="Loading">
          <div className="h-full w-1/2 animate-marquee rounded-full bg-brand-gradient" />
        </div>
      </div>
    );
  }

  const displayUser = { name: user.name, email: user.email };

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
          {composer ? (
            <Composer
              type={composer}
              presetDate={composerDate}
              onBack={() => {
                setComposer(null);
                setComposerDate(undefined);
              }}
            />
          ) : (
            <DashboardScreen
              active={active}
              user={displayUser}
              onNavigate={navigate}
              onCompose={openComposer}
            />
          )}
        </div>
      </main>
    </div>
  );
}
