"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/* Fade + rise on scroll into view. Wrap a landing section to animate it in.
 *
 * Resilient by design: the content renders fully visible. Only after this
 * component mounts (JS running) does it "arm" the hidden start state via a
 * CSS class, then reveal on scroll. If JS never runs, is paused, or the
 * visitor prefers reduced motion, the content is simply shown — never blank.
 * Animation styles live in app/globals.css (.reveal / .reveal-armed). */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // JS is running — safe to hide first, then animate in.
    setArmed(true);

    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const classes = [
    "reveal",
    armed && "reveal-armed",
    visible && "is-visible",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={classes} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
