"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  registerSchema,
  passwordStrength,
  type RegisterValues,
} from "@/lib/validations";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/forms/form-field";
import { PasswordInput } from "@/components/forms/password-input";
import { SocialAuth } from "@/components/forms/social-auth";
import { AuthCard, AuthDivider } from "@/components/forms/auth-card";

const STRENGTH_LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = [
  "bg-destructive",
  "bg-destructive",
  "bg-amber-500",
  "bg-brand-400",
  "bg-success",
];

function StrengthMeter({ password }: { password: string }) {
  const score = passwordStrength(password);
  if (!password) return null;
  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < score ? STRENGTH_COLORS[score] : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength:{" "}
        <span className="font-medium text-foreground">{STRENGTH_LABELS[score]}</span>
      </p>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      password: "",
      confirmPassword: "",
      terms: false as unknown as true,
    },
  });

  const password = watch("password");
  const terms = watch("terms");

  async function onSubmit(values: RegisterValues) {
    try {
      await registerUser(values.name, values.email, values.password);
      toast.success("Account created!", {
        description: "Welcome to Postly — let's get you set up.",
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) {
          for (const [field, message] of Object.entries(err.fieldErrors)) {
            if (["name", "email", "password"].includes(field)) {
              setError(field as keyof RegisterValues, { message });
            }
          }
        }
        if (err.status === 409) {
          setError("email", { message: "An account with this email already exists" });
        }
        toast.error("Couldn't create account", { description: err.message });
      } else {
        toast.error("Something went wrong", {
          description: "Please try again in a moment.",
        });
      }
    }
  }

  return (
    <AuthCard title="Create Account" subtitle="Fill in your details to get started.">
      <SocialAuth mode="register" />
      <AuthDivider>or sign up with email</AuthDivider>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[15px]" noValidate>
        <Field label="Full Name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" placeholder="Jane Cooper" aria-invalid={!!errors.name} {...register("name")} />
        </Field>

        <Field label="Email Address" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" aria-invalid={!!errors.email} {...register("email")} />
        </Field>

        <div className="grid grid-cols-1 gap-[15px] min-[480px]:grid-cols-2">
          <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
            <Input id="phone" type="tel" autoComplete="tel" placeholder="+1 (555) 000-0000" {...register("phone")} />
          </Field>
          <Field label="Company" htmlFor="company" error={errors.company?.message}>
            <Input id="company" placeholder="Acme Inc." {...register("company")} />
          </Field>
        </div>

        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" placeholder="••••••••" aria-invalid={!!errors.password} {...register("password")} />
          <StrengthMeter password={password} />
        </Field>

        <Field label="Confirm Password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <PasswordInput id="confirmPassword" autoComplete="new-password" placeholder="••••••••" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
        </Field>

        <div className="space-y-2">
          <label className="flex cursor-pointer items-start gap-2.5 text-[13.5px] leading-relaxed text-[#475569] dark:text-slate-300">
            <Checkbox
              className="mt-0.5"
              checked={terms}
              onCheckedChange={(v) => setValue("terms", (v === true) as true, { shouldValidate: true })}
            />
            <span>
              I agree to the{" "}
              <Link href="#" className="font-semibold text-[#2563EB] hover:underline">
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link href="#" className="font-semibold text-[#2563EB] hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.terms && (
            <p role="alert" className="text-sm text-destructive">
              {errors.terms.message}
            </p>
          )}
        </div>

        <Button type="submit" variant="brand" size="lg" className="mt-1.5 w-full" loading={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create Account"}
        </Button>
      </form>

      <p className="mt-[22px] text-center text-[14px] text-[#64748B] dark:text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-[#22C55E] hover:underline">
          Login
        </Link>
      </p>
    </AuthCard>
  );
}
