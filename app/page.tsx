import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { SocialProof } from "@/components/SocialProof";
import { HowItWorks } from "@/components/HowItWorks";
import { Reasons } from "@/components/Reasons";
import { Testimonial } from "@/components/Testimonial";
import { Recruiters } from "@/components/Recruiters";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <SocialProof />
        <HowItWorks />
        <Reasons />
        <Testimonial />
        <Recruiters />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
