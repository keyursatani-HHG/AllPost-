import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description:
    "Forgot your Postly password? Enter your email and we'll send you a secure link to reset it and get back to managing your social channels.",
  alternates: { canonical: "/forgot-password" },
  openGraph: { url: "/forgot-password" },
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      heading="Forgot your password?"
      subtext="No worries — it happens. Enter your email and we'll send you a secure link to reset it."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
