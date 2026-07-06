"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  ImageIcon,
  Info,
  Loader2,
  Send,
  X,
  XCircle,
} from "lucide-react";

import { postsApi, scheduleApi, mediaApi, ApiError } from "@/lib/api";
import type { SocialAccount } from "@/types";
import { PlatformGlyph } from "@/components/dashboard/icons";

// Backend platform name -> brand glyph code + chip colour (mirrors composer.tsx).
const GLYPH: Record<string, string> = {
  instagram: "ig", twitter: "tw", x: "tw", linkedin: "li", facebook: "fb",
  youtube: "yt", tiktok: "tt", pinterest: "pin", threads: "th", bluesky: "bs",
};
const PLATFORM_BG: Record<string, string> = {
  instagram: "linear-gradient(135deg,#E1306C,#F77737)", twitter: "#1D1D1F", x: "#1D1D1F",
  linkedin: "#0A66C2", facebook: "#1877F2", youtube: "#FF0000", tiktok: "#0F172A",
  pinterest: "#E60023", threads: "#0F172A", bluesky: "#1185FE",
};

const MAX_FILES = 20;          // safety cap for a single batch
const BLUESKY_MAX_IMAGES = 4;  // Bluesky allows up to 4 images per post

type Mode = "separate" | "single";
type RowStatus = "pending" | "working" | "done" | "failed";
type Row = { key: string; label: string; status: RowStatus; url?: string; error?: string };

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors"
      style={{ background: on ? "#22C55E" : "#CBD5E1" }}
      aria-pressed={on}
    >
      <span className="absolute top-[3px] size-5 rounded-full bg-white shadow transition-all" style={{ left: on ? 23 : 3 }} />
    </button>
  );
}

function StatusIcon({ status }: { status: RowStatus }) {
  if (status === "working") return <Loader2 className="size-4 animate-spin text-[#22C55E]" />;
  if (status === "done") return <CheckCircle2 className="size-4 text-[#16A34A]" />;
  if (status === "failed") return <XCircle className="size-4 text-[#EF4444]" />;
  return <span className="size-2 rounded-full bg-[#CBD5E1]" />;
}

export function BulkImageUpload({ onBack }: { onBack: () => void }) {
  const [accounts, setAccounts] = React.useState<SocialAccount[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [files, setFiles] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [captions, setCaptions] = React.useState<string[]>([]);
  const [sharedCaption, setSharedCaption] = React.useState("");
  const [mode, setMode] = React.useState<Mode>("separate");
  const [busy, setBusy] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([]);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    scheduleApi.accounts().then(setAccounts).catch(() => setAccounts([]));
  }, []);

  // Object URLs for thumbnails — revoke on change/unmount to avoid leaks.
  React.useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function toggleAccount(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => {
      const merged = [...prev, ...picked].slice(0, MAX_FILES);
      return merged;
    });
    setCaptions((prev) => {
      const next = [...prev];
      picked.forEach(() => next.push(""));
      return next.slice(0, MAX_FILES);
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setCaptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function setCaption(i: number, val: string) {
    setCaptions((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  }

  const usedInSingle = Math.min(files.length, BLUESKY_MAX_IMAGES);
  const canPublish = selected.size > 0 && files.length > 0 && !busy;

  function summarize(results: { status: string; url?: string; error?: string }[]) {
    const ok = results.filter((r) => r.status === "published");
    const failed = results.filter((r) => r.status === "failed");
    if (ok.length > 0) return { status: "done" as const, url: ok[0].url };
    if (failed.length > 0) return { status: "failed" as const, error: failed[0].error };
    return { status: "failed" as const, error: "Not published (platform not wired yet)." };
  }

  async function publishOne(mediaUrls: string[], content: string) {
    const post = await postsApi.create({ content, media_urls: mediaUrls, hashtags: [] });
    const { results } = await scheduleApi.publish({
      post_id: post.id,
      social_account_ids: Array.from(selected),
    });
    return summarize(results);
  }

  async function run() {
    if (selected.size === 0) return toast.error("Select an account to post to");
    if (files.length === 0) return toast.error("Add at least one image");

    setBusy(true);
    try {
      if (mode === "single") {
        const imgs = files.slice(0, BLUESKY_MAX_IMAGES);
        setRows([{ key: "single", label: `Post with ${imgs.length} image${imgs.length > 1 ? "s" : ""}`, status: "working" }]);
        const uploaded = await Promise.all(imgs.map((f) => mediaApi.upload(f)));
        const res = await publishOne(uploaded.map((u) => u.url), sharedCaption.trim() || "Image post");
        setRows([{ key: "single", label: `Post with ${imgs.length} image${imgs.length > 1 ? "s" : ""}`, ...res }]);
        if (res.status === "done") toast.success("Posted live to Bluesky 🎉", { description: "Your photo set is live." });
        else toast.error("Post failed", { description: res.error });
      } else {
        const initial: Row[] = files.map((f, i) => ({ key: `${i}-${f.name}`, label: f.name, status: "pending" }));
        setRows(initial);
        let okCount = 0;
        for (let i = 0; i < files.length; i++) {
          setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "working" } : r)));
          try {
            const up = await mediaApi.upload(files[i]);
            const res = await publishOne([up.url], captions[i]?.trim() || "Image post");
            if (res.status === "done") okCount++;
            setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...res } : r)));
          } catch (e) {
            const msg = e instanceof ApiError ? e.message : "Failed";
            setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "failed", error: msg } : r)));
          }
        }
        if (okCount === files.length) toast.success(`Posted ${okCount} image${okCount > 1 ? "s" : ""} live 🎉`);
        else if (okCount > 0) toast.warning(`Posted ${okCount} of ${files.length}`, { description: "Some images failed — see the list." });
        else toast.error("None posted", { description: "All images failed to publish." });
      }
    } catch (e) {
      toast.error("Couldn't publish", { description: e instanceof ApiError ? e.message : "Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#64748B] hover:text-[#0F172A]">
        <ArrowLeft className="size-4" /> Back
      </button>
      <h1 className="mb-4 text-[30px] font-extrabold tracking-[-0.02em] text-[#0F172A]">Bulk Image Upload</h1>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main column */}
        <div className="min-w-0 flex-1">
          {/* Mode selector */}
          <div className="mb-5 inline-flex rounded-xl border border-[#E5E7EB] bg-white p-1">
            <button
              onClick={() => setMode("separate")}
              className={"rounded-lg px-4 py-2 text-[13.5px] font-bold transition-colors " + (mode === "separate" ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:text-[#0F172A]")}
            >
              One post per image
            </button>
            <button
              onClick={() => setMode("single")}
              className={"rounded-lg px-4 py-2 text-[13.5px] font-bold transition-colors " + (mode === "single" ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:text-[#0F172A]")}
            >
              All images in one post
            </button>
          </div>

          {/* Account selector */}
          {accounts.length > 0 ? (
            <div className="mb-6 flex flex-wrap gap-3">
              {accounts.map((a) => {
                const on = selected.has(a.id);
                return (
                  <button key={a.id} onClick={() => toggleAccount(a.id)} title={a.handle} className="relative">
                    <span
                      className="grid size-12 place-items-center rounded-full border-2 text-[13px] font-bold text-white transition-all"
                      style={{ background: PLATFORM_BG[a.platform] || "#94A3B8", borderColor: on ? "#22C55E" : "transparent", opacity: on ? 1 : 0.5 }}
                    >
                      {a.handle.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-white bg-white">
                      <PlatformGlyph code={GLYPH[a.platform] || "tw"} size={12} color="#0F172A" />
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mb-6 rounded-xl border border-dashed border-[#E5E7EB] bg-white px-4 py-3 text-[13.5px] text-[#94A3B8]">
              No connected accounts yet. Connect one from <span className="font-semibold text-[#16A34A]">Connections</span>.
            </div>
          )}

          {/* Dropzone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            className="mb-5 flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-6 py-10 text-center transition-colors hover:border-[#86EFAC]"
          >
            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => addFiles(e.target.files)} />
            <ImageIcon className="mb-3 size-11 text-[#22C55E]" strokeWidth={1.6} />
            <div className="text-[17px] font-extrabold text-[#0F172A]">Click to upload or drag and drop</div>
            <div className="mt-1 text-[13px] text-[#94A3B8]">Select multiple images (up to {MAX_FILES})</div>
          </div>

          {/* Single-mode shared caption + note */}
          {mode === "single" && files.length > 0 && (
            <div className="mb-5">
              <textarea
                value={sharedCaption}
                onChange={(e) => setSharedCaption(e.target.value)}
                placeholder="Shared caption for the post…"
                className="min-h-[90px] w-full resize-y rounded-xl border border-[#E5E7EB] bg-white p-3.5 text-[14px] text-[#0F172A] outline-none focus:border-[#86EFAC]"
              />
              {files.length > BLUESKY_MAX_IMAGES && (
                <p className="mt-2 flex items-center gap-1.5 text-[13px] text-[#F59E0B]">
                  <Info className="size-3.5" /> Bluesky allows 4 images per post — only the first {BLUESKY_MAX_IMAGES} will be used.
                </p>
              )}
            </div>
          )}

          {/* File list */}
          {files.length > 0 && (
            <div className="mb-5 grid grid-cols-1 gap-3">
              {files.map((f, i) => {
                const dimmed = mode === "single" && i >= usedInSingle;
                return (
                  <div key={`${i}-${f.name}`} className={"flex items-start gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3 " + (dimmed ? "opacity-40" : "")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previews[i]} alt={f.name} className="size-16 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="truncate text-[13px] font-semibold text-[#334155]">{f.name}</span>
                        <button onClick={() => removeFile(i)} className="ml-auto grid size-6 shrink-0 place-items-center rounded-md text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#EF4444]" aria-label="Remove">
                          <X className="size-4" />
                        </button>
                      </div>
                      {mode === "separate" && (
                        <input
                          value={captions[i] ?? ""}
                          onChange={(e) => setCaption(i, e.target.value)}
                          placeholder="Caption for this image…"
                          className="w-full rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-[13px] text-[#0F172A] outline-none focus:border-[#86EFAC]"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Progress */}
          {rows.length > 0 && (
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
              <div className="mb-2 text-[13px] font-extrabold text-[#0F172A]">Publishing</div>
              <div className="flex flex-col gap-2">
                {rows.map((r) => (
                  <div key={r.key} className="flex items-center gap-2.5 text-[13px]">
                    <StatusIcon status={r.status} />
                    <span className="truncate text-[#334155]">{r.label}</span>
                    {r.status === "done" && r.url && (
                      <a href={r.url} target="_blank" rel="noreferrer" className="ml-auto shrink-0 font-semibold text-[#16A34A] hover:underline">View</a>
                    )}
                    {r.status === "failed" && r.error && (
                      <span className="ml-auto shrink-0 truncate text-[#EF4444]">{r.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-full lg:w-[330px]">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="mb-4 text-[16px] font-extrabold text-[#0F172A]">Publish</div>
            <div className="mb-4 space-y-1.5 text-[13px] text-[#64748B]">
              <div className="flex justify-between"><span>Mode</span><span className="font-semibold text-[#0F172A]">{mode === "single" ? "One post" : "Per image"}</span></div>
              <div className="flex justify-between"><span>Images</span><span className="font-semibold text-[#0F172A]">{files.length}</span></div>
              <div className="flex justify-between"><span>Accounts</span><span className="font-semibold text-[#0F172A]">{selected.size}</span></div>
              <div className="flex justify-between"><span>Posts to create</span><span className="font-semibold text-[#0F172A]">{mode === "single" ? (files.length > 0 ? 1 : 0) : files.length}</span></div>
            </div>
            <button
              onClick={run}
              disabled={!canPublish}
              className={
                "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14.5px] font-bold transition-all disabled:cursor-not-allowed " +
                (canPublish ? "bg-brand-gradient text-white shadow-glow" : "bg-[#E5E7EB] text-[#94A3B8]")
              }
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {busy ? "Publishing…" : "Publish all"}
            </button>
            {!canPublish && !busy && (
              <p className="mt-2 flex items-center gap-1.5 text-[13px] text-[#94A3B8]">
                <Info className="size-3.5" />
                {selected.size === 0 ? "Select an account" : "Add at least one image"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
