import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Expertise from "@/components/sections/Expertise";
import Services from "@/components/sections/Services";
import Projects from "@/components/sections/Projects";
import Experience from "@/components/sections/Experience";
import Gallery from "@/components/sections/Gallery";
import Testimonials from "@/components/sections/Testimonials";
import Contact from "@/components/sections/Contact";

// Testimonials pull live APPROVED comments straight from Prisma (no fetch()
// calls, so per-request cache options don't apply). Without this, the page
// is fully static and only refreshes via the admin route's revalidatePath("/")
// call — if that ever misses (e.g. a comment is approved/seeded outside that
// API), the cached homepage can go stale indefinitely. This bounds staleness
// to 5 minutes as a safety net on top of the on-demand revalidation.
export const revalidate = 300;

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Expertise />
      <Services />
      <Projects />
      <Experience />
      <Gallery />
      <Testimonials />
      <Contact />
    </>
  );
}
