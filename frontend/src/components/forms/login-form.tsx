"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { loginSchema, type LoginValues } from "@/lib/validations";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/forms/form-field";
import { PasswordInput } from "@/components/forms/password-input";
import { SocialAuth } from "@/components/forms/social-auth";
import { AuthCard, AuthDivider } from "@/components/forms/auth-card";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const redirectTo = searchParams.get("from") || "/dashboard";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const remember = watch("remember");

  // Surface OAuth callback errors (e.g. ?error=google_failed) as a toast.
  React.useEffect(() => {
    const err = searchParams.get("error");
    if (!err) return;
    const messages: Record<string, string> = {
      google_unavailable: "Google sign-in isn't configured on the server yet.",
      google_failed: "Google sign-in failed. Please try again.",
      google_state: "Your Google sign-in session expired. Please try again.",
      google_email: "Your Google account email isn't verified.",
    };
    toast.error("Couldn't sign in with Google", {
      description: messages[err] ?? "Please try again.",
    });
    router.replace("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: LoginValues) {
    try {
      await login(values.email, values.password);
      toast.success("Welcome back!", { description: "You're now signed in." });
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) {
          for (const [field, message] of Object.entries(err.fieldErrors)) {
            if (field === "email" || field === "password") setError(field, { message });
          }
        }
        if (err.status === 401) {
          setError("password", { message: "Incorrect email or password" });
        }
        toast.error("Sign in failed", { description: err.message });
      } else {
        toast.error("Something went wrong", {
          description: "Please try again in a moment.",
        });
      }
    }
  }

  return (
    <AuthCard title="Welcome Back" subtitle="Enter your details to sign in.">
      <SocialAuth mode="login" next={redirectTo} />
      <AuthDivider>or sign in with email</AuthDivider>

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

        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </Field>

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-medium text-[#475569] dark:text-slate-300">
            <Checkbox
              checked={remember}
              onCheckedChange={(v) => setValue("remember", v === true)}
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-[13.5px] font-semibold text-[#2563EB] hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="brand" size="lg" className="mt-1.5 w-full" loading={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Login"}
        </Button>
      </form>

      <p className="mt-[22px] text-center text-[14px] text-[#64748B] dark:text-slate-400">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-bold text-[#22C55E] hover:underline">
          Register
        </Link>
      </p>
    </AuthCard>
  );
}
