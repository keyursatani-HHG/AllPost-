import Link from "next/link";

import { footerNav, siteConfig } from "@/lib/site";
import { Logo } from "@/components/shared/logo";

const socials = [
  {
    label: "Twitter",
    href: siteConfig.links.twitter,
    path: "M22 5.9c-.7.3-1.5.5-2.3.6.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4 4 0 0 0-6.8 3.6A11.4 11.4 0 0 1 3.7 4.6a4 4 0 0 0 1.2 5.3c-.6 0-1.2-.2-1.7-.5a4 4 0 0 0 3.2 4 4 4 0 0 1-1.8.1 4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 18a11.3 11.3 0 0 0 6.1 1.8c7.4 0 11.4-6.1 11.4-11.4v-.5c.8-.6 1.5-1.3 2-2z",
  },
  {
    label: "LinkedIn",
    href: siteConfig.links.linkedin,
    path: "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.3 18H5.7V9.7h2.6V18zM7 8.5A1.5 1.5 0 1 1 7 5.5a1.5 1.5 0 0 1 0 3zM18.3 18h-2.6v-4c0-1-.4-1.6-1.2-1.6-.7 0-1 .4-1.2 1V18H10.7V9.7h2.5v1.1c.4-.6 1-.9 2-.9 1.9 0 3 1.2 3 3.5V18z",
  },
];

function PinIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#5BC878" strokeWidth="2" className="mt-0.5 shrink-0">
      <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#5BC878" strokeWidth="2" className="shrink-0">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#5BC878" strokeWidth="2" className="shrink-0">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 6L2 7" />
    </svg>
  );
}

export function Footer() {
  const { contact } = siteConfig;

  return (
    <footer id="contact" className="scroll-mt-20 bg-[#0F172A] px-6 pb-8 pt-[72px] text-[#CBD5E1]">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-[52px] grid gap-11 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.4fr]">
          {/* Brand */}
          <div>
            <Logo light />
            <p className="mb-5 mt-[18px] max-w-[300px] text-[14.5px] leading-relaxed text-[#94A3B8]">
              The all-in-one platform to create, schedule, and publish content
              everywhere your audience is.
            </p>
            <div className="flex gap-2.5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid size-[38px] place-items-center rounded-[10px] bg-white/[0.06] transition-colors hover:bg-white/[0.12]"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="#CBD5E1">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerNav).map(([group, links]) => (
            <div key={group}>
              <div className="mb-4 text-[14px] font-bold text-white">{group}</div>
              <div className="flex flex-col gap-[11px]">
                {links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-[14px] text-[#94A3B8] transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Contact */}
          <div>
            <div className="mb-4 text-[14px] font-bold text-white">Contact &amp; Address</div>
            <div className="flex flex-col gap-3 text-[14px] text-[#94A3B8]">
              <div className="flex items-start gap-2.5">
                <PinIcon />
                <span>
                  {contact.address[0]}
                  <br />
                  {contact.address[1]}
                </span>
              </div>
              <a href={contact.phoneHref} className="flex items-center gap-2.5 text-[#94A3B8] hover:text-white">
                <PhoneIcon />
                {contact.phone}
              </a>
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 text-[#94A3B8] hover:text-white">
                <MailIcon />
                {contact.email}
              </a>
              <a
                href={contact.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-2 text-[13.5px] font-semibold text-[#5BC878] hover:underline"
              >
                View on Google Maps →
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-[26px]">
          <span className="text-[13.5px] text-[#64748B]">
            © 2026 {siteConfig.company} All rights reserved.
          </span>
          <span className="text-[13.5px] text-[#64748B]">
            Made for creators, everywhere.
          </span>
        </div>
      </div>
    </footer>
  );
}
