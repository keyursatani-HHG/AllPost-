/* -------------------------------------------------------------------------- */
/*  Platforms (hero orbit + cross-post tiles)                                  */
/* -------------------------------------------------------------------------- */

export type Platform = {
  name: string;
  code: string;
  /** CSS background — solid colour or gradient. */
  bg: string;
};

export const platforms: Platform[] = [
  { name: "Instagram", code: "IG", bg: "linear-gradient(135deg,#E1306C,#F77737)" },
  { name: "TikTok", code: "TT", bg: "#0F172A" },
  { name: "X / Twitter", code: "X", bg: "#1D1D1F" },
  { name: "YouTube", code: "YT", bg: "#FF0000" },
  { name: "LinkedIn", code: "in", bg: "#0A66C2" },
  { name: "Facebook", code: "f", bg: "#1877F2" },
];

/* -------------------------------------------------------------------------- */
/*  Hero social proof                                                          */
/* -------------------------------------------------------------------------- */

export const heroAvatars = [
  { init: "SC", color: "#2563EB" },
  { init: "MR", color: "#5BC878" },
  { init: "AK", color: "#7C3AED" },
  { init: "TB", color: "#F59E0B" },
];

export const trustedBy = ["Lumen", "Northwind", "Vantage", "Driftstudio", "Reach"];

/* -------------------------------------------------------------------------- */
/*  Features (alternating rows)                                                */
/* -------------------------------------------------------------------------- */

export type Feature = {
  eyebrow: string;
  accent: "green" | "blue";
  title: string;
  description: string;
  cta: string;
  reverse: boolean;
  visual: "crosspost" | "calendar" | "library" | "studio";
};

export const features: Feature[] = [
  {
    eyebrow: "CROSS POSTING",
    accent: "green",
    title: "Post everywhere at once",
    description:
      "Write once and publish to Instagram, TikTok, YouTube, X, LinkedIn and more — each optimized automatically for its platform. No more copy-paste chaos.",
    cta: "Try Cross Posting",
    reverse: false,
    visual: "crosspost",
  },
  {
    eyebrow: "SCHEDULING",
    accent: "blue",
    title: "Schedule posts effortlessly",
    description:
      "Plan weeks of content in a visual calendar. Drag, drop, and let Postly publish automatically at the moment your audience is most active.",
    cta: "Explore Scheduling",
    reverse: true,
    visual: "calendar",
  },
  {
    eyebrow: "CONTENT MANAGEMENT",
    accent: "green",
    title: "Manage every post efficiently",
    description:
      "A single library for all your drafts, scheduled posts, and published content. Search, filter, and reuse your best-performing posts in a click.",
    cta: "Open Library",
    reverse: false,
    visual: "library",
  },
  {
    eyebrow: "CONTENT STUDIO",
    accent: "green",
    title: "Create content, effortlessly",
    description:
      "Beat the blank page with an AI studio that writes captions, suggests hashtags, and resizes media for every platform — all in your brand voice.",
    cta: "Open Studio",
    reverse: true,
    visual: "studio",
  },
];

/* -------------------------------------------------------------------------- */
/*  Stats                                                                      */
/* -------------------------------------------------------------------------- */

export type Stat = {
  value: string;
  suffix?: string;
  label: string;
  variant: "green" | "dark" | "blue";
};

export const stats: Stat[] = [
  { value: "9", suffix: "+", label: "Social platforms supported", variant: "green" },
  { value: "20,32,637", suffix: "+", label: "Posts published & counting", variant: "dark" },
  { value: "2 min", label: "Average time to publish", variant: "blue" },
];

/* -------------------------------------------------------------------------- */
/*  Testimonials                                                               */
/* -------------------------------------------------------------------------- */

export type Testimonial = {
  name: string;
  role: string;
  init: string;
  color: string;
  text: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "Head of Growth, Lumen",
    init: "SC",
    color: "#2563EB",
    text: "We cut our posting time by 80%. What used to take my team an entire morning now happens before my coffee gets cold.",
  },
  {
    name: "Marcus Rivera",
    role: "Founder, Drift Studio",
    init: "MR",
    color: "#5BC878",
    text: "The scheduling calendar is the cleanest I have ever used. One dashboard, every platform, zero chaos.",
  },
  {
    name: "Aisha Kapoor",
    role: "Social Lead, Northwind",
    init: "AK",
    color: "#7C3AED",
    text: "Cross-posting used to mean five tabs and a spreadsheet. Now it is one click and I am done for the day.",
  },
  {
    name: "Tom Becker",
    role: "Creator · 2.1M followers",
    init: "TB",
    color: "#F59E0B",
    text: "The content studio helped me stay consistent for the first time in years. My reach doubled in a single quarter.",
  },
  {
    name: "Elena Fischer",
    role: "CMO, Vantage",
    init: "EF",
    color: "#EF4444",
    text: "Analytics plus publishing in one place means my team finally makes decisions on data, not vibes.",
  },
  {
    name: "Daniel Osei",
    role: "Owner, Reach Collective",
    init: "DO",
    color: "#0EA5E9",
    text: "Managing 40 client accounts was a nightmare before. Postly is the backbone of our entire operation now.",
  },
];

/* -------------------------------------------------------------------------- */
/*  FAQ                                                                        */
/* -------------------------------------------------------------------------- */

export type Faq = { question: string; answer: string };

export const faqs: Faq[] = [
  {
    question: "What is Postly?",
    answer:
      "Postly is an all-in-one social media management platform that lets you create, schedule, and publish content to every major network from a single, beautifully simple dashboard.",
  },
  {
    question: "Which platforms are supported?",
    answer:
      "We support 9+ networks including Instagram, TikTok, YouTube, X, LinkedIn, Facebook, Pinterest, Threads, and Bluesky — with new integrations added regularly.",
  },
  {
    question: "Can I schedule posts in advance?",
    answer:
      "Yes. Build your content calendar days, weeks, or months ahead and Postly publishes automatically at the optimal time for each platform.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We use bank-grade encryption and OAuth-only connections, and we never store your passwords. You stay in full control of every connected account.",
  },
  {
    question: "Do you provide customer support?",
    answer:
      "Every plan includes 24/7 support from real humans, plus a dedicated success manager on our Team and Enterprise plans.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Blog                                                                       */
/* -------------------------------------------------------------------------- */

export type BlogPost = {
  category: string;
  categoryText: string;
  gradient: string;
  glow: string;
  date: string;
  readTime: string;
  title: string;
  excerpt: string;
  author: { name: string; role: string; init: string; color: string };
  icon: "chart" | "sparkle" | "trend";
};

export const blogPosts: BlogPost[] = [
  {
    category: "Strategy",
    categoryText: "#166534",
    gradient: "linear-gradient(135deg,#5BC878,#22C55E)",
    glow: "radial-gradient(circle at 75% 25%, rgba(255,255,255,0.28), transparent 55%)",
    date: "Jun 24, 2026",
    readTime: "6 min read",
    title: "The 2026 social playbook: what actually works",
    excerpt:
      "The formats, cadence, and cross-posting tactics driving real reach this year — backed by data from 12,000 teams.",
    author: { name: "Sarah Chen", role: "Head of Growth", init: "SC", color: "#2563EB" },
    icon: "chart",
  },
  {
    category: "Product",
    categoryText: "#0F172A",
    gradient: "linear-gradient(135deg,#0F172A,#334155)",
    glow: "radial-gradient(circle at 30% 30%, rgba(91,200,120,0.35), transparent 55%)",
    date: "Jun 12, 2026",
    readTime: "4 min read",
    title: "Introducing AI Content Studio",
    excerpt:
      "Go from a blank page to platform-ready captions, hashtags, and resized media in seconds — all in your brand voice.",
    author: { name: "Marcus Rivera", role: "Product Lead", init: "MR", color: "#5BC878" },
    icon: "sparkle",
  },
  {
    category: "Growth",
    categoryText: "#1D4ED8",
    gradient: "linear-gradient(135deg,#2563EB,#3B82F6)",
    glow: "radial-gradient(circle at 70% 70%, rgba(255,255,255,0.26), transparent 55%)",
    date: "May 30, 2026",
    readTime: "5 min read",
    title: "How Northwind grew reach 3x",
    excerpt:
      "A behind-the-scenes look at the cross-posting workflow that tripled one team's reach in a single quarter.",
    author: { name: "Aisha Kapoor", role: "Social Lead", init: "AK", color: "#7C3AED" },
    icon: "trend",
  },
];
