"use client";

import Image from "next/image";
import Link from "next/link";
import { Container } from "./ui";
import { img } from "./images";
import { CountUp } from "./motion/CountUp";

const BULLETS = [
  "No membership fee. No upfront cost.",
  "Choose the positions you want to work.",
  "Submit qualified candidates.",
  "Earn the published recruiter fee when your candidate is successfully hired.",
];

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

        {/* Hero Content */}
        <Container className="relative z-10 text-center">
          <div className="hero-rise mx-auto max-w-3xl">
            <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-200 mb-6">
              No Membership Fee — Recruiter Network
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl leading-tight">
              Find Candidates. Make Placements.
              <br className="hidden sm:block" /> Earn $1,000–$3,000 Per Hire.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto font-medium">
              JobFolder connects experienced recruiters with active positions
              from hiring companies across every engineering discipline.
            </p>

            <ul className="mt-8 mx-auto flex max-w-xl flex-col gap-2.5 text-left sm:mx-auto">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm md:text-base text-blue-50 font-medium">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="mt-0.5 shrink-0" aria-hidden>
                    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.4" className="text-cyan-200" />
                    <path d="M6.5 10l2.3 2.3L14 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-200" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                href="/jobs"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-full px-8 py-4 text-base font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg bg-white text-blue-brand hover:bg-blue-50"
              >
                Browse Open Positions
              </Link>
              <Link
                href="/signup"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-white/30 px-8 py-4 text-base font-bold text-white transition-all duration-300 hover:bg-white/10"
              >
                Join as a Recruiter
              </Link>
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
                candidates placed through JobFolder
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
