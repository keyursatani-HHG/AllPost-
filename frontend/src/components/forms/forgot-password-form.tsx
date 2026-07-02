"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, MailCheck } from "lucide-react";

import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validations";
import { authApi, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/form-field";
import { AuthCard } from "@/components/forms/auth-card";

export function ForgotPasswordForm() {
  const [sent, setSent] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    try {
      await authApi.forgotPassword({ email: values.email });
    } catch (err) {
      // Only surface genuine network failures — never reveal if an email exists.
      if (err instanceof ApiError && err.status === 0) {
        setError("email", { message: err.message });
        return;
      }
    }
    setSent(values.email);
  }

  if (sent) {
    return (
      <AuthCard title="Check your inbox" subtitle="A reset link is on its way.">
        <div className="flex flex-col items-center gap-5 py-2 text-center">
          <div className="grid size-16 place-items-center rounded-2xl bg-success/10 text-success">
            <MailCheck className="size-8" />
          </div>
          <p className="text-[15px] text-[#475569] dark:text-slate-300">
            If an account exists for{" "}
            <span className="font-semibold text-foreground">{sent}</span>, we&apos;ve
            sent a link to reset your password.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-success" />
            Link expires in 30 minutes
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset password" subtitle="Enter your email and we'll send you a reset link.">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[15px]" noValidate>
        <Field label="Email Address" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </Field>

        <Button type="submit" variant="brand" size="lg" className="mt-1.5 w-full" loading={isSubmitting}>
          {isSubmitting ? "Sending link…" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-[22px] text-center text-[14px] text-[#64748B] dark:text-slate-400">
        Remembered it?{" "}
        <Link href="/login" className="font-bold text-[#22C55E] hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
