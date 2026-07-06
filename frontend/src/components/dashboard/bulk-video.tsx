"use client";

import * as React from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Info, Loader2, Send, Video, X, XCircle } from "lucide-react";

import { postsApi, scheduleApi, mediaApi, ApiError } from "@/lib/api";
import type { SocialAccount } from "@/types";
import { PlatformGlyph } from "@/components/dashboard/icons";

const GLYPH: Record<string, string> = {
  instagram: "ig", twitter: "tw", x: "tw", linkedin: "li", facebook: "fb",
  youtube: "yt", tiktok: "tt", pinterest: "pin", threads: "th", bluesky: "bs",
};
const PLATFORM_BG: Record<string, string> = {
  instagram: "linear-gradient(135deg,#E1306C,#F77737)", twitter: "#1D1D1F", x: "#1D1D1F",
  linkedin: "#0A66C2", facebook: "#1877F2", youtube: "#FF0000", tiktok: "#0F172A",
  pinterest: "#E60023", threads: "#0F172A", bluesky: "#1185FE",
};

const MAX_FILES = 10;

type RowStatus = "pending" | "working" | "done" | "failed";
type Row = { key: string; label: string; status: RowStatus; url?: string; error?: string };

function StatusIcon({ status }: { status: RowStatus }) {
  if (status === "working") return <Loader2 className="size-4 animate-spin text-[#22C55E]" />;
  if (status === "done") return <CheckCircle2 className="size-4 text-[#16A34A]" />;
  if (status === "failed") return <XCircle className="size-4 text-[#EF4444]" />;
  return <span className="size-2 rounded-full bg-[#CBD5E1]" />;
}

export function BulkVideoUpload({ onBack }: { onBack: () => void }) {
  const [accounts, setAccounts] = React.useState<SocialAccount[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [files, setFiles] = React.useState<File[]>([]);
  const [captions, setCaptions] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([]);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    scheduleApi.accounts().then(setAccounts).catch(() => setAccounts([]));
  }, []);

  function toggleAccount(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list).filter((f) => f.type.startsWith("video/"));
    if (picked.length === 0) {
      toast.error("Please choose video files");
      return;
    }
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_FILES));
    setCaptions((prev) => [...prev, ...picked.map(() => "")].slice(0, MAX_FILES));
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setCaptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function setCaption(i: number, val: string) {
    setCaptions((prev) => { const n = [...prev]; n[i] = val; return n; });
  }

  const canPublish = selected.size > 0 && files.length > 0 && !busy;

  async function run() {
    if (selected.size === 0) return toast.error("Select an account to post to");
    if (files.length === 0) return toast.error("Add at least one video");

    setBusy(true);
    const accountIds = Array.from(selected);
    setRows(files.map((f, i) => ({ key: `${i}-${f.name}`, label: f.name, status: "pending" })));
    let ok = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "working" } : r)));
        try {
          const up = await mediaApi.upload(files[i]);
          const post = await postsApi.create({ content: captions[i]?.trim() || "Video post", media_urls: [up.url], hashtags: [] });
          const { results } = await scheduleApi.publish({ post_id: post.id, social_account_ids: accountIds });
          const published = results.find((r) => r.status === "published");
          const failed = results.find((r) => r.status === "failed");
          if (published) {
            ok++;
            setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "done", url: published.url } : r)));
          } else {
            setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "failed", error: failed?.error || "Not published" } : r)));
          }
        } catch (e) {
          const msg = e instanceof ApiError ? e.message : "Failed";
          setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "failed", error: msg } : r)));
        }
      }
      if (ok === files.length) toast.success(`Posted ${ok} video${ok > 1 ? "s" : ""} live 🎉`);
      else if (ok > 0) toast.warning(`Posted ${ok} of ${files.length}`, { description: "Some videos failed — see the list." });
      else toast.error("None posted", { description: "All videos failed to publish." });
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
          <Video className="size-[18px]" strokeWidth={1.9} />
        </span>
        <h1 className="text-[30px] font-extrabold tracking-[-0.02em] text-[#0F172A]">Bulk Video Upload</h1>
      </div>
      <p className="mb-6 text-[14px] text-[#64748B]">Upload multiple videos, caption each, and post them to your connected accounts.</p>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
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
            <input ref={fileRef} type="file" multiple accept="video/*" className="hidden" onChange={(e) => addFiles(e.target.files)} />
            <Video className="mb-3 size-11 text-[#22C55E]" strokeWidth={1.6} />
            <div className="text-[17px] font-extrabold text-[#0F172A]">Click to upload or drag and drop</div>
            <div className="mt-1 text-[13px] text-[#94A3B8]">Select multiple videos (up to {MAX_FILES}, max 50 MB each)</div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="mb-5 grid grid-cols-1 gap-3">
              {files.map((f, i) => (
                <div key={`${i}-${f.name}`} className="flex items-start gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
                  <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-[#111827] text-[#94A3B8]">
                    <Video className="size-6" strokeWidth={1.7} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="truncate text-[13px] font-semibold text-[#334155]">{f.name}</span>
                      <span className="shrink-0 text-[12px] text-[#94A3B8]">{(f.size / 1048576).toFixed(1)} MB</span>
                      <button onClick={() => removeFile(i)} className="ml-auto grid size-6 shrink-0 place-items-center rounded-md text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#EF4444]" aria-label="Remove">
                        <X className="size-4" />
                      </button>
                    </div>
                    <input
                      value={captions[i] ?? ""}
                      onChange={(e) => setCaption(i, e.target.value)}
                      placeholder="Caption for this video…"
                      className="w-full rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-[13px] text-[#0F172A] outline-none focus:border-[#86EFAC]"
                    />
                  </div>
                </div>
              ))}
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
              <div className="flex justify-between"><span>Videos</span><span className="font-semibold text-[#0F172A]">{files.length}</span></div>
              <div className="flex justify-between"><span>Accounts</span><span className="font-semibold text-[#0F172A]">{selected.size}</span></div>
              <div className="flex justify-between"><span>Posts to create</span><span className="font-semibold text-[#0F172A]">{files.length}</span></div>
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
                {selected.size === 0 ? "Select an account" : "Add at least one video"}
              </p>
            )}
            <p className="mt-3 flex items-start gap-1.5 text-[12.5px] leading-snug text-[#94A3B8]">
              <Info className="mt-[1px] size-3.5 shrink-0" />
              Bluesky requires a confirmed email to post videos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
