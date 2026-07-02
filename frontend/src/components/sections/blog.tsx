import Link from "next/link";

import { blogPosts } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/reveal";

function BlogIcon({ type }: { type: string }) {
  const common = { width: 56, height: 56, viewBox: "0 0 24 24", fill: "none" };
  if (type === "chart")
    return (
      <svg {...common} stroke="#fff" strokeWidth="1.6" className="opacity-85">
        <path d="M3 3v18h18" />
        <path d="M7 15l3-3 3 2 5-6" />
      </svg>
    );
  if (type === "sparkle")
    return (
      <svg {...common} width={54} height={54} stroke="#5BC878" strokeWidth="1.6" className="opacity-90">
        <path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3z" />
      </svg>
    );
  return (
    <svg {...common} stroke="#fff" strokeWidth="1.6" className="opacity-90">
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M17 7h4v4" />
    </svg>
  );
}

export function Blog() {
  return (
    <section id="blog" className="scroll-mt-20 bg-muted px-6 py-24">
      <div className="mx-auto max-w-[1200px]">
        <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[620px]">
            <span className="mb-4 inline-block rounded-full bg-[#DCFCE7] px-3.5 py-1.5 text-[13px] font-bold text-[#16A34A]">
              FROM THE BLOG
            </span>
            <h2 className="text-[32px] font-black leading-[1.1] tracking-[-0.03em] text-[#0F172A] sm:text-[44px] dark:text-white">
              Insights to grow faster
            </h2>
            <p className="mt-3 text-[18px] leading-relaxed text-[#64748B] dark:text-slate-300">
              Playbooks, product news, and creator stories from the Postly team.
            </p>
          </div>
          <Button asChild variant="outline" className="whitespace-nowrap">
            <Link href="/#blog">View all posts →</Link>
          </Button>
        </Reveal>

        <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
          {blogPosts.map((post) => (
            <RevealItem key={post.title}>
              <article className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[18px] border border-[#EEF2F6] bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-cardhover dark:bg-card">
                {/* Cover */}
                <div
                  className="relative aspect-[16/10] overflow-hidden"
                  style={{ background: post.gradient }}
                >
                  <div className="absolute inset-0" style={{ background: post.glow }} />
                  <span
                    className="absolute left-3.5 top-3.5 rounded-full bg-white/90 px-3 py-[5px] text-[12px] font-bold"
                    style={{ color: post.categoryText }}
                  >
                    {post.category}
                  </span>
                  <span className="absolute bottom-4 right-[18px]">
                    <BlogIcon type={post.icon} />
                  </span>
                </div>
                {/* Body */}
                <div className="flex flex-1 flex-col p-[22px] pb-6">
                  <div className="mb-2.5 text-[12.5px] font-semibold text-[#94A3B8]">
                    {post.date} · {post.readTime}
                  </div>
                  <h3 className="mb-2.5 text-[19px] font-extrabold leading-tight tracking-[-0.01em] text-[#0F172A] dark:text-white">
                    {post.title}
                  </h3>
                  <p className="mb-5 flex-1 text-[14.5px] leading-relaxed text-[#64748B] dark:text-slate-300">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-2.5">
                    <span
                      className="grid size-[34px] place-items-center rounded-full text-[12px] font-bold text-white"
                      style={{ background: post.author.color }}
                    >
                      {post.author.init}
                    </span>
                    <div>
                      <div className="text-[13px] font-bold text-[#0F172A] dark:text-white">
                        {post.author.name}
                      </div>
                      <div className="text-[12px] text-[#94A3B8]">{post.author.role}</div>
                    </div>
                  </div>
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
