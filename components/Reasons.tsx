"use client";

import { motion } from "framer-motion";
import { Container } from "./ui";

const reasons = [
  {
    title: "A whole network, not one desk",
    body: "Every role is worked by dozens of specialist recruiters at once — the reach of a marketplace without you managing any of them.",
  },
  {
    title: "We are the filter",
    body: "Candidates are vetted by our team before they reach you. No spray-and-pray submissions, no wading through unqualified profiles.",
  },
  {
    title: "One point of contact",
    body: "You deal with JobFolder, start to finish. We coordinate every recruiter behind the scenes so you never have to.",
  },
  {
    title: "Pay on the hire",
    body: "No retainers, no upfront cost. Our fee and the recruiter bounty are settled only once your new hire is confirmed.",
  },
  {
    title: "Fast, without the noise",
    body: "A curated shortlist in days, not months — because the sourcing runs in parallel while we do the quality control.",
  },
  {
    title: "Expert brief, every time",
    body: "We turn your requirement into a sharp spec the network can act on, drawing on a decade of placements across roles.",
  },
];

export function Reasons() {
  return (
    <section id="companies" className="bg-gray-50/10 py-20 border-b border-gray-100 overflow-hidden">
      <Container>
        <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          {/* Left: Copy Column */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-brand">
              For companies
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              More reasons companies come to JobFolder
            </h2>
            <p className="mt-4 text-base text-muted leading-relaxed max-w-md">
              Whether you&apos;re hiring your fifth employee or your five
              hundredth, you get one accountable partner and a shortlist you can
              trust.
            </p>
            <div className="mt-8">
              <a
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-blue-brand px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-brand-dark hover:-translate-y-0.5 hover:shadow-md"
              >
                Start hiring
              </a>
            </div>
          </div>

          {/* Right: Orbit Concentric Circles Visualization */}
          <div className="relative flex h-[380px] sm:h-[480px] w-full items-center justify-center select-none">
            
            {/* Center Node */}
            <div className="absolute z-20 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08)] border border-gray-100">
              <span className="text-xs font-extrabold tracking-widest text-gray-400">JOBFOLDER</span>
            </div>

            {/* Inner Circle (Orbit 1) */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
              className="absolute z-10 h-[180px] w-[180px] rounded-full border border-dashed border-gray-200"
            >
              {/* Discipline: DOT */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
                className="absolute top-0 left-1/2 -ml-5 -mt-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#1b5cff]/10 text-blue-brand font-bold text-[10px] shadow-sm border border-blue-100"
              >
                DOT
              </motion.div>
              {/* Discipline: AEC */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
                className="absolute bottom-0 left-1/2 -ml-5 -mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px] shadow-sm border border-blue-500"
              >
                AEC
              </motion.div>
            </motion.div>

            {/* Middle Circle (Orbit 2) */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 32, ease: "linear" }}
              className="absolute z-10 h-[280px] w-[280px] rounded-full border border-dashed border-gray-200/80"
            >
              {/* Discipline: PE */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 32, ease: "linear" }}
                className="absolute top-1/2 left-0 -ml-6 -mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md border border-gray-100"
              >
                <span className="font-extrabold text-[11px] text-blue-brand">PE</span>
              </motion.div>
              {/* Discipline: CEI */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 32, ease: "linear" }}
                className="absolute top-1/2 right-0 -mr-6 -mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-white font-black text-[11px] shadow-md border border-cyan-400"
              >
                CEI
              </motion.div>
            </motion.div>

            {/* Outer Circle (Orbit 3) */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 48, ease: "linear" }}
              className="absolute z-10 h-[380px] w-[380px] rounded-full border border-dashed border-gray-200/60"
            >
              {/* Discipline: MEP */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 48, ease: "linear" }}
                className="absolute top-0 left-1/2 -ml-7 -mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500 font-extrabold text-[11px] shadow-sm border border-gray-200"
              >
                MEP
              </motion.div>
              {/* Discipline: Water */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 48, ease: "linear" }}
                className="absolute bottom-1/4 left-0 -ml-7 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-600 font-bold text-[11px] shadow-sm border border-teal-100"
              >
                Water
              </motion.div>
              {/* Discipline: Geotech */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 48, ease: "linear" }}
                className="absolute bottom-1/4 right-0 -mr-7 flex h-14 w-14 items-center justify-center rounded-full bg-white text-gray-800 font-bold text-[11px] shadow-sm border border-gray-100"
              >
                GEO
              </motion.div>
            </motion.div>

          </div>
        </div>

        {/* Reasons Grid (displayed below the Orbit section) */}
        <div className="mt-20 border-t border-gray-100 pt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r, i) => (
            <div key={r.title} className="group">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-brand-soft text-blue-brand transition-colors duration-300 group-hover:bg-blue-brand group-hover:text-white">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M3 8l3 3 7-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink group-hover:text-blue-brand transition-colors duration-200">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{r.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
