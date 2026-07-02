import { trustedBy } from "@/lib/content";

/**
 * "Powering social teams at" trust strip. Company names are styled wordmarks —
 * swap for real SVG logos when available.
 */
export function Logos() {
  return (
    <section className="px-6 pb-4 pt-2" aria-label="Powering social teams">
      <div className="mx-auto max-w-[1200px] text-center">
        <div className="mb-[22px] text-[12.5px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">
          Powering social teams at
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-[52px] gap-y-6 opacity-60">
          {trustedBy.map((name) => (
            <span
              key={name}
              className="text-[22px] font-extrabold tracking-tight text-[#475569] dark:text-slate-300"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
