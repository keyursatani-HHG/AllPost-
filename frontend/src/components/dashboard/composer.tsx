"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronDown,
  Clipboard,
  ExternalLink,
  ImageIcon,
  Info,
  Save,
  Search,
  Send,
  Sparkles,
} from "lucide-react";

import { postsApi, scheduleApi, mediaApi, ApiError } from "@/lib/api";
import type { SocialAccount } from "@/types";
import { PlatformGlyph } from "@/components/dashboard/icons";

export type ComposerType = "text" | "image" | "video" | "story";

const TITLES: Record<ComposerType, string> = {
  text: "Create text post",
  image: "Create image post",
  video: "Create video post",
  story: "Create story post",
};
const UPLOAD_HINT: Record<Exclude<ComposerType, "text">, string> = {
  image: "Image(s) or PDF",
  video: "Video",
  story: "Image(s) or PDF or Video",
};

// Backend platform name -> brand glyph code used by <PlatformGlyph>.
const GLYPH: Record<string, string> = {
  instagram: "ig", twitter: "tw", x: "tw", linkedin: "li", facebook: "fb",
  youtube: "yt", tiktok: "tt", pinterest: "pin", threads: "th", bluesky: "bs",
};
const PLATFORM_BG: Record<string, string> = {
  instagram: "linear-gradient(135deg,#E1306C,#F77737)", twitter: "#1D1D1F", x: "#1D1D1F",
  linkedin: "#0A66C2", facebook: "#1877F2", youtube: "#FF0000", tiktok: "#0F172A",
  pinterest: "#E60023", threads: "#0F172A", bluesky: "#1185FE",
};

const MAX = 2200;

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

export function Composer({ type, onBack }: { type: ComposerType; onBack: () => void }) {
  const [accounts, setAccounts] = React.useState<SocialAccount[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [caption, setCaption] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [scheduleOn, setScheduleOn] = React.useState(false);
  const [remember, setRemember] = React.useState(false);
  const [busy, setBusy] = React.useState<null | "draft" | "post">(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    scheduleApi.accounts().then(setAccounts).catch(() => setAccounts([]));
  }, []);

  const isStory = type === "story";
  const isText = type === "text";
  const pct = Math.min(caption.length / MAX, 1);

  function toggleAccount(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function onPickFiles(list: FileList | null) {
    if (!list) return;
    setFiles(Array.from(list).slice(0, isStory ? 1 : 10));
  }

  async function save(kind: "draft" | "post") {
    const content = caption.trim() || `${type[0].toUpperCase()}${type.slice(1)} post`;
    if (kind === "post" && selected.size === 0) {
      toast.error("Select an account to post to");
      return;
    }
    if (kind === "post" && !isText && files.length === 0) {
      toast.error("Add an image or video to post");
      return;
    }
    setBusy(kind);
    try {
      // 1. Upload any media the user picked.
      let media_urls: string[] = [];
      if (files.length > 0) {
        const uploaded = await Promise.all(files.map((f) => mediaApi.upload(f)));
        media_urls = uploaded.map((u) => u.url);
      }
      // 2. Create the post record.
      const post = await postsApi.create({ content, media_urls, hashtags: [] });
      // 3. If posting/scheduling, queue it to the selected accounts.
      if (kind === "post") {
        await scheduleApi.schedule({
          post_id: post.id,
          social_account_ids: Array.from(selected),
          scheduled_at: new Date(Date.now() + (scheduleOn ? 3600_000 : 0)).toISOString(),
        });
      }
      toast.success(
        kind === "draft" ? "Saved to drafts" : scheduleOn ? "Scheduled" : "Queued to post",
        {
          description:
            kind === "draft"
              ? "Find it under Posts → Drafts."
              : `${selected.size} account${selected.size > 1 ? "s" : ""} · see Posts → Scheduled.`,
        }
      );
      onBack();
    } catch (e) {
      toast.error("Couldn't save", {
        description: e instanceof ApiError ? e.message : "Please try again.",
      });
    } finally {
      setBusy(null);
    }
  }

  const canPost = selected.size > 0 && (isStory ? files.length > 0 : caption.trim().length > 0 || files.length > 0);

  return (
    <div>
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#64748B] hover:text-[#0F172A]">
        <ArrowLeft className="size-4" /> Back
      </button>
      <h1 className="mb-4 text-[30px] font-extrabold tracking-[-0.02em] text-[#0F172A]">{TITLES[type]}</h1>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main column */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between">
            <button className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[13px] font-semibold text-[#64748B]">
              <Search className="size-3.5" /> Search &amp; Filter <ChevronDown className="size-3.5" />
            </button>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-[#64748B]">
              <span className={remember ? "text-[#16A34A]" : ""}>Remember</span>
              <Toggle on={remember} onToggle={() => setRemember((v) => !v)} />
            </label>
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
                      style={{
                        background: PLATFORM_BG[a.platform] || "#94A3B8",
                        borderColor: on ? "#22C55E" : "transparent",
                        opacity: on ? 1 : 0.5,
                      }}
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
              No connected accounts yet — you can still save drafts. Connect accounts from{" "}
              <span className="font-semibold text-[#16A34A]">Connections</span>.
            </div>
          )}

          {/* Upload dropzone */}
          {!isText && (
            <div
              onClick={() => fileRef.current?.click()}
              className="mb-5 flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-6 py-10 text-center transition-colors hover:border-[#86EFAC]"
            >
              <input
                ref={fileRef}
                type="file"
                multiple={!isStory}
                accept={type === "video" ? "video/*" : type === "story" ? "image/*,video/*" : "image/*,application/pdf"}
                className="hidden"
                onChange={(e) => onPickFiles(e.target.files)}
              />
              <ImageIcon className="mb-3 size-11 text-[#22C55E]" strokeWidth={1.6} />
              <div className="text-[17px] font-extrabold text-[#0F172A]">Click to upload or drag and drop</div>
              <div className="mt-1 flex items-center gap-1.5 text-[13px] text-[#94A3B8]">
                or hover and paste from clipboard <Clipboard className="size-3.5" />
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[13.5px] font-semibold text-[#64748B]">
                {UPLOAD_HINT[type as Exclude<ComposerType, "text">]} <Info className="size-3.5 text-[#CBD5E1]" />
              </div>
              {files.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {files.map((f, i) =>
                    f.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={URL.createObjectURL(f)}
                        alt={f.name}
                        className="size-20 rounded-lg border border-[#E5E7EB] object-cover"
                      />
                    ) : (
                      <div key={i} className="grid size-20 place-items-center rounded-lg border border-[#E5E7EB] bg-[#F1F5F9] px-1 text-center text-[10px] font-semibold text-[#64748B]">
                        {(f.name.split(".").pop() || "file").toUpperCase()}
                      </div>
                    )
                  )}
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                className="mt-4 inline-flex items-center gap-2 self-end rounded-lg bg-brand-gradient px-4 py-2 text-[13px] font-bold text-white"
              >
                <ExternalLink className="size-4" /> Import
              </button>
            </div>
          )}

          {/* Caption / story note */}
          {isStory ? (
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-5 py-4 text-[13.5px] text-[#64748B]">
              Stories don&apos;t support captions, carousels, or cover images. Pick exactly one image or video.
            </div>
          ) : (
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[14px] font-bold text-[#0F172A]">
                Main Caption <Info className="size-3.5 text-[#CBD5E1]" />
              </div>
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, MAX))}
                  placeholder="Start writing your post here..."
                  rows={5}
                  className="w-full resize-none text-[14.5px] text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
                />
                <div className="mt-2 flex items-center justify-end gap-2 text-[13px] text-[#94A3B8]">
                  {caption.length}/{MAX}
                  <svg width="16" height="16" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="8" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                    <circle cx="10" cy="10" r="8" fill="none" stroke="#22C55E" strokeWidth="3" strokeDasharray={`${pct * 50.3} 50.3`} strokeLinecap="round" transform="rotate(-90 10 10)" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Tools */}
          <div className="mt-6">
            <div className="mb-2.5 text-[13px] font-semibold text-[#94A3B8]">Post configurations &amp; tools</div>
            <div className="flex flex-wrap gap-2.5">
              <button className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3.5 py-2 text-[13px] font-semibold text-[#334155]">
                <span className="size-2 rounded-full bg-[#CBD5E1]" /> Platform Captions <ChevronDown className="size-3.5" />
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3.5 py-2 text-[13px] font-semibold text-[#334155]">
                <Sparkles className="size-3.5 text-[#22C55E]" /> Past Captions <ChevronDown className="size-3.5" />
              </button>
              {type === "video" && (
                <button className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3.5 py-2 text-[13px] font-semibold text-[#334155]">
                  Processing <ChevronDown className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: schedule panel */}
        <div className="w-full lg:w-[330px]">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[16px] font-extrabold text-[#0F172A]">Schedule post</span>
              <Toggle on={scheduleOn} onToggle={() => setScheduleOn((v) => !v)} />
            </div>
            <button
              onClick={() => save("post")}
              disabled={!canPost || busy !== null}
              className={
                "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14.5px] font-bold transition-all disabled:cursor-not-allowed " +
                (canPost ? "bg-brand-gradient text-white shadow-glow" : "bg-[#E5E7EB] text-[#94A3B8]")
              }
            >
              <Send className="size-4" /> {busy === "post" ? "Posting…" : scheduleOn ? "Schedule" : "Post now"}
            </button>
            {!canPost && (
              <p className="mt-2 flex items-center gap-1.5 text-[13px] text-[#94A3B8]">
                <Info className="size-3.5" /> Select an account to post to
              </p>
            )}
            <button
              onClick={() => save("draft")}
              disabled={busy !== null}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] py-3 text-[14px] font-bold text-[#64748B] hover:bg-[#F1F5F9] disabled:opacity-60"
            >
              <Save className="size-4" /> {busy === "draft" ? "Saving…" : "Save to Drafts"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
