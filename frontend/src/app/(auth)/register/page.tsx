import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/forms/register-form";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Start publishing everywhere in minutes. Join thousands of creators and teams growing with Postly — no credit card required.",
  alternates: { canonical: "/register" },
  openGraph: { url: "/register", images: ["/opengraph-image"] },
  // Utility page — no SEO value; keep it out of the index.
  robots: { index: false, follow: true },
};

export default function RegisterPage() {
  return (
    <AuthShell
      heading="Create your account"
      subtext="Start publishing everywhere in minutes. Join thousands of creators and teams growing with Postly."
    >
      <RegisterForm />
    </AuthShell>
  );
}
