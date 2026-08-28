import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { OpenPositions } from "@/components/OpenPositions";
import { RecruiterFeeSection } from "@/components/RecruiterFeeSection";
import { SocialProof } from "@/components/SocialProof";
import { HowItWorks } from "@/components/HowItWorks";
import { Reasons } from "@/components/Reasons";
import { JoinOnDemand } from "@/components/JoinOnDemand";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/motion/Reveal";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <Hero />

        <Reveal>
          <OpenPositions />
        </Reveal>

        <Reveal>
          <RecruiterFeeSection />
        </Reveal>

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
          <JoinOnDemand />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
