/**
 * Central site configuration — single source of truth for metadata,
 * navigation and contact details. Mirrors the approved Postly design.
 */
export const siteConfig = {
  name: "Postly",
  shortName: "Postly",
  tagline: "Post to all platforms instantly",
  description:
    "The all-in-one platform to create, schedule, and publish content everywhere your audience is — from one simple, powerful dashboard.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ogImage: "/og.png",
  company: "Postly Inc.",
  contact: {
    email: "hello@postly.app",
    phone: "+1 (415) 555-0192",
    phoneHref: "tel:+14155550192",
    address: ["340 Market Street, Suite 500", "San Francisco, CA 94103"],
    mapUrl: "https://maps.google.com/?q=340+Market+Street+San+Francisco",
  },
  keywords: [
    "social media management",
    "social media scheduler",
    "cross posting tool",
    "content calendar",
    "post to all platforms",
    "Instagram scheduler",
    "TikTok scheduler",
    "LinkedIn scheduler",
    "social media analytics",
    "Postly",
  ],
  links: {
    twitter: "https://twitter.com/postly",
    instagram: "https://instagram.com/postly",
    linkedin: "https://linkedin.com/company/postly",
  },
} as const;

export type NavItem = {
  label: string;
  href: string;
};

/** Primary nav. Anchors match the design's section ids. */
export const mainNav: NavItem[] = [
  { label: "Home", href: "/#top" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "About", href: "/#about" },
  { label: "Blog", href: "/#blog" },
  { label: "Contact", href: "/#contact" },
];

export const footerNav = {
  "Quick Links": [
    { label: "Home", href: "/#top" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "About", href: "/#about" },
    { label: "FAQ", href: "/#faq" },
  ],
  Company: [
    { label: "Contact", href: "/#contact" },
    { label: "Careers", href: "#" },
    { label: "Blog", href: "/#blog" },
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
} as const;
