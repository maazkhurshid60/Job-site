"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "./ui";
import { img } from "./images";
import { CountUp } from "./motion/CountUp";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pb-16 pt-6">
      {/* Royal Blue Curved Banner Container */}
      <div className="relative mx-auto max-w-[1400px] overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl md:rounded-[40px] px-6 pb-32 pt-20 md:pb-48 md:pt-28 shadow-2xl">
        
        {/* Floating Shapes Background */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute -top-12 -left-12 h-64 w-64 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute top-1/2 right-12 h-80 w-80 rounded-full bg-indigo-300 blur-3xl" />
          <div className="absolute bottom-4 left-1/3 h-52 w-52 rounded-full bg-white blur-3xl" />
        </div>

        {/* Floating Badges */}
        {/* Badge 1: Cloud */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0 }}
          className="absolute left-[8%] top-[12%] hidden md:flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/20"
        >
          <span className="text-blue-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19A6 6 0 0 0 22 13a6 6 0 0 0-6-6h-.5A8 8 0 0 0 4.5 9a6 6 0 0 0 1 11.5H17.5z" />
            </svg>
          </span>
          Cloud
        </motion.div>

        {/* Badge 2: Microsoft */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute left-[6%] top-[45%] hidden md:flex items-center gap-2.5 rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-gray-800 shadow-[0_10px_35px_rgb(0,0,0,0.08)] border border-white/20"
        >
          <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
            <span className="bg-[#f25022] w-1.5 h-1.5" />
            <span className="bg-[#7fba00] w-1.5 h-1.5" />
            <span className="bg-[#00a4ef] w-1.5 h-1.5" />
            <span className="bg-[#ffb900] w-1.5 h-1.5" />
          </div>
          Microsoft
        </motion.div>

        {/* Badge 3: AWS */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          className="absolute left-[10%] bottom-[18%] hidden md:flex items-center gap-2 rounded-full bg-blue-brand/30 text-cyan-300 font-bold px-5 py-3 text-sm shadow-[0_12px_40px_rgb(27,92,255,0.25)] border border-cyan-400/20 backdrop-blur-sm"
        >
          <span className="tracking-tight text-white">aws</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </motion.div>

        {/* Badge 4: Airbnb */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2.2 }}
          className="absolute right-[8%] bottom-[25%] hidden md:flex items-center gap-2.5 rounded-full bg-white/95 px-5 py-3 text-sm font-semibold text-gray-800 shadow-[0_10px_35px_rgb(0,0,0,0.08)] border border-white/20"
        >
          <span className="text-[#ff5a5f]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </span>
          airbnb
        </motion.div>

        {/* Badge 5: Uber */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
          className="absolute right-[6%] top-[35%] hidden md:flex items-center gap-2 rounded-full bg-gray-900 text-white px-5 py-2.5 text-sm font-bold shadow-[0_10px_35px_rgb(0,0,0,0.15)] border border-gray-800"
        >
          UBER
        </motion.div>

        {/* Hero Content */}
        <Container className="relative z-10 text-center">
          <div className="hero-rise mx-auto max-w-3xl">
            <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-200 mb-6">
              Why Metro Associates
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl leading-tight">
              Hiring that brings the right people and companies together.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto font-medium">
              We put a network of specialist recruiters behind every role, screen every candidate ourselves, and stay your single point of contact — so you only ever meet talent worth hiring.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
              <a
                href="/signup"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-full px-8 py-4 text-base font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg bg-white text-blue-brand hover:bg-blue-50"
              >
                Get started
              </a>
              <a
                href="#how"
                className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 text-base font-bold text-white transition-all duration-300"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition-transform group-hover:scale-110">
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M3 2l6 4-6 4V2z" fill="currentColor" />
                  </svg>
                </span>
                See how it works
              </a>
            </div>

            {/* Placed Candidates Counter */}
            <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-white/15 pt-8">
              <div className="flex -space-x-2">
                {img.avatars.map((src, i) => (
                  <span
                    key={src}
                    className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-indigo-600 bg-indigo-500 shrink-0"
                  >
                    <Image
                      src={src}
                      alt={`Placed candidate ${i + 1}`}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  </span>
                ))}
              </div>
              <p className="text-sm text-blue-100 font-medium">
                <span className="font-extrabold text-white">
                  <CountUp to={27500} suffix="+" />
                </span>{" "}
                candidates placed through Metro Associates
              </p>
            </div>
          </div>
        </Container>

        {/* Custom SVG Asymmetric Wave Divider at the Bottom */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="relative block w-full h-[60px] md:h-[100px] text-white fill-current"
          >
            <path
              d="M0,0 C150,90 350,120 600,100 C850,80 1050,40 1200,0 L1200,120 L0,120 Z"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
