"use client";

import { useState } from "react";

/* A password field with a show/hide toggle. Used on every account form —
   login, signup, admin login, admin setup — so it lives here rather than in
   any one of them. */
export function PasswordInput({
  value,
  onChange,
  autoComplete,
  placeholder,
  required = true,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`input pr-10 ${className}`}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
      >
        {visible ? (
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M2 2l16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path
              d="M8.3 5.4C8.8 5.3 9.4 5.2 10 5.2c6 0 9 4.8 9 4.8s-1 1.7-3 3.2M5.7 6.6C3.5 8 2 9.9 2 9.9s3 5.8 9 5.8c1.1 0 2.1-.2 3-.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8.1 8.2a2.5 2.5 0 003.5 3.6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M1 10s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        )}
      </button>
    </div>
  );
}
