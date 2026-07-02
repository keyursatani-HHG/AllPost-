"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { mainNav } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-border/80 bg-white/80 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-lg backdrop-saturate-150 dark:bg-background/80"
          : "border-transparent bg-white/50 backdrop-blur-sm dark:bg-background/50"
      )}
    >
      <nav
        className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-6 py-4"
        aria-label="Primary"
      >
        <Logo />

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1.5 lg:flex">
          {mainNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="rounded-[9px] px-[15px] py-[9px] text-[14.5px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-ring dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2.5">
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="brand">
            <Link href="/register">Register</Link>
          </Button>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 focus-ring lg:hidden dark:text-slate-200 dark:hover:bg-white/5"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-border bg-white/95 backdrop-blur-lg lg:hidden dark:bg-background/95"
          >
            <ul className="mx-auto flex max-w-[1200px] flex-col gap-1 px-6 py-4">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-3 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-ring dark:text-slate-200 dark:hover:bg-white/5"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="mt-3 sm:hidden">
                <Button asChild variant="outline" size="lg" className="w-full" onClick={() => setOpen(false)}>
                  <Link href="/login">Login</Link>
                </Button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
