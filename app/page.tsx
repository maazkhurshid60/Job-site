import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { SocialProof } from "@/components/SocialProof";
import { HowItWorks } from "@/components/HowItWorks";
import { Reasons } from "@/components/Reasons";
import { Testimonial } from "@/components/Testimonial";
import { Recruiters } from "@/components/Recruiters";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/motion/Reveal";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Reveal>
          <SocialProof />
        </Reveal>
        <Reveal>
          <HowItWorks />
        </Reveal>
        <Reveal>
          <Reasons />
        </Reveal>
        <Reveal>
          <Testimonial />
        </Reveal>
        <Reveal>
          <Recruiters />
        </Reveal>
        <Reveal>
          <CTA />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
