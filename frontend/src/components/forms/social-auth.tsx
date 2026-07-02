"use client";

import { toast } from "sonner";

import { API_URL } from "@/lib/api";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="#0F172A" aria-hidden className="dark:fill-white">
      <path d="M16.36 12.68c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.75 2.28-1.6 2.78-.41 6.9 1.15 9.15.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.66zM14.1 5.9c.64-.78 1.07-1.85.95-2.93-.92.04-2.03.61-2.69 1.38-.59.69-1.11 1.79-.97 2.84 1.02.08 2.07-.52 2.71-1.29z" />
    </svg>
  );
}

const btnClass =
  "flex w-full items-center justify-center gap-2.5 rounded-[11px] border border-[#E2E8F0] bg-white px-3 py-3 text-[14.5px] font-semibold text-[#1E293B] transition-colors hover:border-[#CBD5E1] hover:bg-[#F8FAFC] focus-ring dark:border-white/10 dark:bg-transparent dark:text-white dark:hover:bg-white/5";

export function SocialAuth({
  mode = "login",
  next = "/dashboard",
}: {
  mode?: "login" | "register";
  next?: string;
}) {
  const verb = mode === "register" ? "Sign up with" : "Continue with";

  // Full-page redirect into the backend's Google OAuth flow. The backend
  // handles Google, sets the httpOnly refresh cookie, and redirects back to
  // `next` — the AuthProvider then bootstraps the session automatically.
  const startGoogle = () => {
    window.location.assign(
      `${API_URL}/auth/google/login?next=${encodeURIComponent(next)}`
    );
  };

  const appleSoon = () =>
    toast.info("Apple sign-in", {
      description: "Coming soon. Google sign-in is available now.",
    });

  return (
    <div className="flex flex-col gap-2.5">
      <button type="button" className={btnClass} onClick={startGoogle}>
        <GoogleIcon />
        {verb} Google
      </button>
      <button type="button" className={btnClass} onClick={appleSoon}>
        <AppleIcon />
        {verb} Apple
      </button>
    </div>
  );
}
