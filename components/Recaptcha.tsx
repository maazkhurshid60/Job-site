"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: HTMLElement, params: Record<string, unknown>) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaScriptLoad?: () => void;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    if (window.grecaptcha) { resolve(); return; }
    window.onRecaptchaScriptLoad = () => resolve();
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaScriptLoad&render=explicit";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/* The contact form's "I'm not a robot" checkbox. Renders nothing (and lets
   the form submit unguarded, matching today's behaviour) until
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY is set — see .env.local for how to get one.

   reCAPTCHA can't be re-rendered into the same DOM node once used, and its
   tokens are single-use — so after a failed submit, the caller must remount
   this component (e.g. `<Recaptcha key={attempt} ... />` with `attempt`
   bumped on failure) rather than expect it to reset itself in place. */
export function Recaptcha({ onChange }: { onChange: (token: string | null) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  // Widget setup must only run once per mount — `onChange` is typically a
  // fresh inline function on every parent render, and re-rendering the
  // widget into the same node throws, so the effect reads the latest
  // handler through a ref instead of depending on it directly.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;
    loadScript().then(() => {
      if (cancelled || !containerRef.current || !window.grecaptcha) return;
      window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onChangeRef.current(token),
        "expired-callback": () => onChangeRef.current(null),
      });
    });
    return () => { cancelled = true; };
  }, [siteKey]);

  if (!siteKey) return null;
  return <div ref={containerRef} />;
}
