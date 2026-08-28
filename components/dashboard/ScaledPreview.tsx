"use client";

import { useEffect, useRef, useState } from "react";

/* The recruiter-site preview uses the same `lg:` Tailwind classes as the real
   published page — but those breakpoints key off the browser's viewport
   width, not this narrow side panel, so at native size the two-column hero
   and offset photo card render as if there were 1000+px of room and spill
   out of the panel.

   Fix: always render the real content at a representative desktop width
   (PREVIEW_WIDTH), then scale the whole thing down with a CSS transform to
   fit whatever width the panel actually has. This is the standard
   "device preview" trick — the layout always looks like the real desktop
   site, just shrunk, instead of a cramped mobile-ish squeeze. */

const PREVIEW_WIDTH = 1120;

export function ScaledPreview({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => {
      setScale(wrap.clientWidth / PREVIEW_WIDTH);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const ro = new ResizeObserver(() => {
      setContentHeight(content.scrollHeight);
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="w-full overflow-hidden" style={{ height: contentHeight * scale || undefined }}>
      <div
        ref={contentRef}
        style={{ width: PREVIEW_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  );
}
