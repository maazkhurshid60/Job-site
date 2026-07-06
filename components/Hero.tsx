"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { Container, Button, Eyebrow } from "./ui";
import { img } from "./images";
import { CountUp } from "./motion/CountUp";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream">
      {/* floating decorative shapes */}
      <FloatShape className="left-[52%] -top-6 h-16 w-16 rounded-[30%] bg-coral" delay={0} />
      <FloatShape className="bottom-24 left-[46%] h-12 w-12 rounded-[30%] bg-lime" delay={0.6} />
      <FloatShape className="bottom-16 right-16 h-6 w-6 rounded-full bg-primary" delay={1.1} />

      <Container className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        {/* Copy */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item}>
            <Eyebrow>Why Metro Opportunities</Eyebrow>
          </motion.div>
          <motion.h1
            variants={item}
            className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl"
          >
            Hiring that brings the&nbsp;right people and companies together.
          </motion.h1>
          <motion.p
            variants={item}
            className="mt-5 max-w-md text-base leading-7 text-muted"
          >
            We put a network of specialist recruiters behind every role, screen
            every candidate ourselves, and stay your single point of contact —
            so you only ever meet talent worth hiring.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Button href="/signup">Get started</Button>
            <a
              href="#how"
              className="group inline-flex items-center gap-3 text-sm font-semibold text-ink"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-coral text-white transition-transform group-hover:scale-110">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M3 2l6 4-6 4V2z" fill="currentColor" />
                </svg>
              </span>
              See how it works
            </a>
          </motion.div>

          <motion.div variants={item} className="mt-10 flex items-center gap-3">
            <div className="flex -space-x-2">
              {img.avatars.map((src, i) => (
                <span
                  key={src}
                  className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-cream bg-cream-deep"
                >
                  <Image
                    src={src}
                    alt={`Placed candidate ${i + 1}`}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </span>
              ))}
            </div>
            <p className="text-sm text-muted">
              <span className="font-bold text-ink">
                <CountUp to={27500} suffix="+" />
              </span>{" "}
              candidates placed through Metro Opportunities
            </p>
          </motion.div>
        </motion.div>

        {/* Product mockup */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
          className="relative"
        >
          <PipelineMockup />
        </motion.div>
      </Container>
    </section>
  );
}

/* A softly floating brand shape (respects the hero's absolute positioning). */
function FloatShape({
  className,
  delay,
}: {
  className: string;
  delay: number;
}) {
  return (
    <motion.span
      aria-hidden
      className={`pointer-events-none absolute hidden lg:block ${className}`}
      animate={{ y: [0, -14, 0], rotate: [0, 8, 0] }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

/* A stylised in-app view: the screening pipeline that sits between
   recruiters and the client — our core differentiator. */
function PipelineMockup() {
  const stages = [
    { label: "Submitted", count: 24, tone: "bg-line text-muted" },
    { label: "Screening", count: 11, tone: "bg-coral-soft text-coral" },
    { label: "Client review", count: 5, tone: "bg-primary-soft text-primary" },
  ];
  const candidates = [
    { name: "Senior Backend Engineer", meta: "Approved · 3 in review", ok: true },
    { name: "Product Designer", meta: "Screening · 2 candidates", ok: false },
    { name: "Growth Marketer", meta: "Approved · shortlist sent", ok: true },
  ];

  return (
    <div className="rounded-2xl border border-line bg-white shadow-[0_24px_60px_-24px_rgba(23,19,15,0.25)]">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-coral" />
        <span className="h-2.5 w-2.5 rounded-full bg-lime" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
        <span className="ml-3 text-xs font-medium text-muted">
          Metro Opportunities · Hiring dashboard
        </span>
      </div>

      <div className="space-y-5 p-5">
        {/* stage counters */}
        <div className="grid grid-cols-3 gap-3">
          {stages.map((s) => (
            <div key={s.label} className="rounded-xl border border-line p-3">
              <span
                className={`inline-flex rounded-pill px-2 py-0.5 text-[11px] font-semibold ${s.tone}`}
              >
                {s.label}
              </span>
              <p className="mt-2 text-2xl font-extrabold text-ink">
                <CountUp to={s.count} />
              </p>
            </div>
          ))}
        </div>

        {/* role rows */}
        <div className="space-y-2.5">
          {candidates.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.15, duration: 0.4 }}
              className="flex items-center justify-between rounded-xl border border-line px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-ink">{c.name}</p>
                <p className="text-xs text-muted">{c.meta}</p>
              </div>
              <span
                className={`grid h-7 w-7 place-items-center rounded-full ${
                  c.ok ? "bg-primary-soft text-primary" : "bg-coral-soft text-coral"
                }`}
              >
                {c.ok ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M6 4v2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                )}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
