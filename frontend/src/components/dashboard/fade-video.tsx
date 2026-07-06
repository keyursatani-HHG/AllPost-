"use client";

import * as React from "react";
import { toast } from "sonner";
import { ArrowLeft, Download, ImageIcon, Info, Loader2, Sparkles, X } from "lucide-react";

import { studioApi, mediaUrl, ApiError } from "@/lib/api";

export function FadeVideoStudio({ onBack }: { onBack: () => void }) {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const pickRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function onPick(list: FileList | null) {
    const f = list?.[0];
    if (pickRef.current) pickRef.current.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Please choose an image file");
    setFile(f);
    setVideoUrl(null);
  }

  async function generate() {
    if (!file) return toast.error("Add an image first");
    setBusy(true);
    setVideoUrl(null);
    try {
      const res = await studioApi.fadeVideo(file);
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
          <ImageIcon className="size-[18px]" strokeWidth={1.9} />
        </span>
        <h1 className="text-[30px] font-extrabold tracking-[-0.02em] text-[#0F172A]">Single Fade-in Video</h1>
      </div>
      <p className="mb-6 text-[14px] text-[#64748B]">Turn one image into a short 1080×1080 clip that fades in from black.</p>

      <input ref={pickRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files)} />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-[520px]">
            {preview ? (
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#111827]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Selected" className="size-full object-cover" />
                <button
                  onClick={() => { setFile(null); setVideoUrl(null); }}
                  className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/75"
                  aria-label="Remove image"
                >
                  <X className="size-4" />
                </button>
                <button onClick={() => pickRef.current?.click()} className="absolute inset-0" aria-label="Replace image" />
              </div>
            ) : (
              <button
                onClick={() => pickRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); onPick(e.dataTransfer.files); }}
                className="flex aspect-square w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E1] bg-white text-center transition-colors hover:border-[#86EFAC]"
              >
                <ImageIcon className="mb-3 size-11 text-[#22C55E]" strokeWidth={1.6} />
                <div className="text-[17px] font-extrabold text-[#0F172A]">Click to upload or drag and drop</div>
                <div className="mt-1 text-[13px] text-[#94A3B8]">One image</div>
              </button>
            )}
          </div>
        </div>

        <div className="w-full lg:w-[340px]">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="mb-4 text-[16px] font-extrabold text-[#0F172A]">Generate</div>
            <div className="mb-4 space-y-1.5 text-[13px] text-[#64748B]">
              <div className="flex justify-between"><span>Image</span><span className="font-semibold text-[#0F172A]">{file ? "1 / 1" : "0 / 1"}</span></div>
              <div className="flex justify-between"><span>Output</span><span className="font-semibold text-[#0F172A]">1080×1080 · MP4</span></div>
              <div className="flex justify-between"><span>Length</span><span className="font-semibold text-[#0F172A]">4s</span></div>
            </div>
            <button
              onClick={generate}
              disabled={!file || busy}
              className={
                "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14.5px] font-bold transition-all disabled:cursor-not-allowed " +
                (file && !busy ? "bg-brand-gradient text-white shadow-glow" : "bg-[#E5E7EB] text-[#94A3B8]")
              }
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {busy ? "Rendering…" : "Generate video"}
            </button>
            {!file && !busy && (
              <p className="mt-2 flex items-center gap-1.5 text-[13px] text-[#94A3B8]"><Info className="size-3.5" /> Add an image</p>
            )}

            {videoUrl && (
              <div className="mt-5">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video src={videoUrl} controls autoPlay loop muted className="w-full rounded-xl bg-black" />
                <a href={videoUrl} download className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] py-2.5 text-[13.5px] font-bold text-[#334155] hover:bg-[#F1F5F9]">
                  <Download className="size-4" /> Download MP4
                </a>
                <p className="mt-2.5 flex items-start gap-1.5 text-[12.5px] leading-snug text-[#94A3B8]">
                  <Info className="mt-[1px] size-3.5 shrink-0" />
                  To post it, use Bulk Video Upload or a Video Post (Bluesky requires a confirmed email for video).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
