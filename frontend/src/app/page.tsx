import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { Logos } from "@/components/sections/logos";
import { Features } from "@/components/sections/features";
import { Stats } from "@/components/sections/stats";
import { Testimonials } from "@/components/sections/testimonials";
import { Faq } from "@/components/sections/faq";
import { Blog } from "@/components/sections/blog";
import { CTA } from "@/components/sections/cta";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="top">
        <Hero />
        <Logos />
        <Features />
        <Stats />
        <Testimonials />
        <Faq />
        <Blog />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
