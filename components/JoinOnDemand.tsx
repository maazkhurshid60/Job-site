"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "./ui";
import { img } from "./images";

export function JoinOnDemand() {
  const avatars = [
    { src: img.avatars[0], top: "15%", left: "10%", size: "h-14 w-14", delay: 0 },
    { src: img.avatars[1], top: "25%", right: "12%", size: "h-16 w-16", delay: 0.5 },
    { src: img.avatars[2], bottom: "20%", left: "15%", size: "h-16 w-16", delay: 1.2 },
    { src: img.avatars[3], bottom: "15%", right: "18%", size: "h-12 w-12", delay: 0.8 },
    { src: img.clientPortraitB, top: "50%", right: "8%", size: "h-14 w-14", delay: 2.0 },
    { src: img.clientPortraitA, top: "45%", left: "8%", size: "h-14 w-14", delay: 1.7 },
  ];

  return (
    <section id="on-demand" className="relative bg-gray-50/20 py-28 border-b border-gray-100 overflow-hidden min-h-[450px]">
      {/* Background grid lines for structural design */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
      
      {/* Scattered Avatars around the container */}
      {avatars.map((a, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: i * 0.1 }}
          className={`absolute hidden md:block ${a.size} rounded-full overflow-hidden border-4 border-white shadow-[0_8px_25px_rgba(0,0,0,0.06)]`}
          style={{ top: a.top, bottom: a.bottom, left: a.left, right: a.right }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: a.delay }}
            className="w-full h-full relative"
          >
            <Image
              src={a.src}
              alt="Network professional"
              fill
              sizes="80px"
              className="object-cover"
            />
          </motion.div>
        </motion.div>
      ))}

      <Container className="relative z-10 text-center">
        <div className="mx-auto max-w-xl bg-white rounded-3xl border border-gray-100 p-8 sm:p-12 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-brand">
            Join the team
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Join professionals on demand
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Bring the candidates, we&apos;ll bring the roles. JobFolder network matches you to vetted, well-defined positions. Submit your best profiles, and get rewarded.
          </p>
          <div className="mt-8 flex justify-center">
            <a
              href="/recruiters/apply"
              className="inline-flex items-center justify-center rounded-full bg-blue-brand px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-brand-dark hover:-translate-y-0.5 hover:shadow-md"
            >
              Join the network
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
