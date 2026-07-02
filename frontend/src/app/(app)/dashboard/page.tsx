"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, PlusCircle, BarChart3, CalendarClock } from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * Minimal authenticated shell — the redirect target after login/register.
 * Client-side guard complements the edge middleware.
 */
export default function DashboardPage() {
  const { user, status, logout } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?from=/dashboard");
  }, [status, router]);

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-1 w-40 overflow-hidden rounded-full bg-muted" role="status" aria-label="Loading">
          <div className="h-full w-1/2 animate-marquee rounded-full bg-brand-gradient" />
        </div>
      </div>
    );
  }

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-muted/20">
      <header className="border-b border-border bg-background">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
              <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-10">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s what&apos;s happening across your channels today.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: CalendarClock, label: "Scheduled posts", value: "24" },
            { icon: BarChart3, label: "Reach this week", value: "48.2K" },
            { icon: PlusCircle, label: "Connected channels", value: "6" },
          ].map((stat) => (
            <Card key={stat.label} className="p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <stat.icon className="size-5" />
                </span>
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-6 flex flex-col items-center justify-center gap-3 border-dashed p-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
            <PlusCircle className="size-6" />
          </span>
          <h2 className="text-lg font-semibold">Your dashboard starts here</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            This is a starter shell wired to your authenticated session. Build
            out the scheduler, calendar and analytics from here.
          </p>
        </Card>
      </main>
    </div>
  );
}
