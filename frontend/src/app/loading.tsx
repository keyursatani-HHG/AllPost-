import { Logo } from "@/components/shared/logo";

/** Route-level loading UI (App Router Suspense boundary). */
export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6">
      <Logo href={null} />
      <div
        className="h-1 w-40 overflow-hidden rounded-full bg-muted"
        role="status"
        aria-label="Loading"
      >
        <div className="h-full w-1/2 animate-marquee rounded-full bg-brand-gradient" />
      </div>
    </div>
  );
}
