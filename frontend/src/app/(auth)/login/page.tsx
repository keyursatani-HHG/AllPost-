import { Suspense } from "react";
import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Log in",
  description:
    "Log in to your Postly account to schedule posts, collaborate and track performance across every social channel.",
  alternates: { canonical: "/login" },
  openGraph: { url: "/login", images: ["/opengraph-image"] },
  // Utility page — no SEO value; keep it out of the index.
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <AuthShell
      heading="Welcome back"
      subtext="Login to continue managing all your content from one powerful dashboard."
    >
      <Suspense fallback={<div className="h-[520px]" aria-hidden />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
