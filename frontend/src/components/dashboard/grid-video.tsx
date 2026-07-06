"use client";

import * as React from "react";
import { toast } from "sonner";
import { ArrowLeft, Download, Grid2x2, Info, Loader2, Plus, Sparkles, X } from "lucide-react";

import { studioApi, mediaUrl, ApiError } from "@/lib/api";

type Slot = { file: File; preview: string } | null;

export function GridVideoStudio({ onBack }: { onBack: () => void }) {
  const [slots, setSlots] = React.useState<Slot[]>([null, null, null, null]);
  const [busy, setBusy] = React.useState(false);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const pickRef = React.useRef<HTMLInputElement>(null);
  const activeSlot = React.useRef<number>(0);

  // Revoke object URLs on unmount to avoid leaks.
  React.useEffect(() => {
    return () => slots.forEach((s) => s && URL.revokeObjectURL(s.preview));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filled = slots.filter(Boolean).length;
  const ready = filled === 4 && !busy;

  function openPicker(i: number) {
    activeSlot.current = i;
    pickRef.current?.click();
  }

  function onPick(list: FileList | null) {
    const file = list?.[0];
    if (pickRef.current) pickRef.current.value = "";
    if (!file || !file.type.startsWith("image/")) {
      if (file) toast.error("Please choose an image file");
      return;
    }
    const i = activeSlot.current;
    setSlots((prev) => {
      const next = [...prev];
      if (next[i]) URL.revokeObjectURL(next[i]!.preview);
      next[i] = { file, preview: URL.createObjectURL(file) };
      return next;
    });
    setVideoUrl(null);
  }

  function clearSlot(i: number) {
    setSlots((prev) => {
      const next = [...prev];
      if (next[i]) URL.revokeObjectURL(next[i]!.preview);
      next[i] = null;
      return next;
    });
    setVideoUrl(null);
  }

  async function generate() {
    const files = slots.filter(Boolean).map((s) => s!.file);
    if (files.length !== 4) return toast.error("Add all 4 images first");
    setBusy(true);
    setVideoUrl(null);
    try {
      const res = await studioApi.gridVideo(files);
      setVideoUrl(mediaUrl(res.url));
      toast.success("Video generated 🎬", { description: "Preview it below, then download." });
    } catch (e) {
      toast.error("Couldn't generate video", {
        description: e instanceof ApiError ? e.message : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#64748B] hover:text-[#0F172A]">
        <ArrowLeft className="size-4" /> Back
      </button>
      <div className="mb-1 flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-[10px] border border-[#EEF2F6] bg-[#F8FAFC] text-[#64748B]">
          <Grid2x2 className="size-[18px]" strokeWidth={1.9} />
        </span>
        <h1 className="text-[30px] font-extrabold tracking-[-0.02em] text-[#0F172A]">2×2 Grid Video</h1>
      </div>
      <p className="mb-6 text-[14px] text-[#64748B]">Drop in 4 images and we&apos;ll composite them into a short 1080×1080 grid video.</p>

      <input ref={pickRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files)} />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* 2x2 slot grid */}
        <div className="min-w-0 flex-1">
          <div className="mx-auto grid max-w-[520px] grid-cols-2 gap-2 rounded-2xl bg-[#111827] p-2">
            {slots.map((s, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-[#1F2937]">
                {s ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.preview} alt={`Tile ${i + 1}`} className="size-full object-cover" />
                    <button
                      onClick={() => clearSlot(i)}
                      className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/75"
                      aria-label={`Remove image ${i + 1}`}
                    >
                      <X className="size-4" />
                    </button>
                    <button onClick={() => openPicker(i)} className="absolute inset-0" aria-label={`Replace image ${i + 1}`} />
                  </>
                ) : (
                  <button onClick={() => openPicker(i)} className="flex size-full flex-col items-center justify-center gap-1.5 text-[#94A3B8] transition-colors hover:bg-[#273244] hover:text-[#CBD5E1]">
                    <Plus className="size-7" strokeWidth={1.8} />
                    <span className="text-[12.5px] font-semibold">Image {i + 1}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-full lg:w-[340px]">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="mb-4 text-[16px] font-extrabold text-[#0F172A]">Generate</div>
            <div className="mb-4 space-y-1.5 text-[13px] text-[#64748B]">
              <div className="flex justify-between"><span>Images</span><span className="font-semibold text-[#0F172A]">{filled} / 4</span></div>
              <div className="flex justify-between"><span>Output</span><span className="font-semibold text-[#0F172A]">1080×1080 · MP4</span></div>
              <div className="flex justify-between"><span>Length</span><span className="font-semibold text-[#0F172A]">4s</span></div>
            </div>
            <button
              onClick={generate}
              disabled={!ready}
              className={
                "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14.5px] font-bold transition-all disabled:cursor-not-allowed " +
                (ready ? "bg-brand-gradient text-white shadow-glow" : "bg-[#E5E7EB] text-[#94A3B8]")
              }
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {busy ? "Rendering…" : "Generate video"}
            </button>
            {filled < 4 && !busy && (
              <p className="mt-2 flex items-center gap-1.5 text-[13px] text-[#94A3B8]">
                <Info className="size-3.5" /> Add {4 - filled} more image{4 - filled > 1 ? "s" : ""}
              </p>
            )}

            {videoUrl && (
              <div className="mt-5">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video src={videoUrl} controls autoPlay loop muted className="w-full rounded-xl bg-black" />
                <a
                  href={videoUrl}
                  download
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] py-2.5 text-[13.5px] font-bold text-[#334155] hover:bg-[#F1F5F9]"
                >
                  <Download className="size-4" /> Download MP4
                </a>
                <p className="mt-2.5 flex items-start gap-1.5 text-[12.5px] leading-snug text-[#94A3B8]">
                  <Info className="mt-[1px] size-3.5 shrink-0" />
                  Auto-posting videos isn&apos;t wired up yet — download and post it manually for now.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
