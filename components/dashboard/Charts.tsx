"use client";

import { useMemo, useState } from "react";
import {
  SUBMISSION_STATUS_LABEL,
  type Submission,
  type SubmissionStatus,
} from "@/lib/submissions";
import { toDate } from "@/lib/dates";
import { feeTierAmount } from "@/lib/feeTiers";

/* Brand chart palette (validated via the dataviz skill's validator, light mode).
   Status/outcome colors are reserved for state and paired with labels. */
const GREEN = "#1e9e63";
const GREEN_DARK = "#16814f";
const GOLD = "#c2820a";
const CORAL = "#ee5b3f";
const MUTED = "#6f6a63";
const LINE = "#ece5db";

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        {subtitle && <p className="text-[11px] text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyPlot({ label }: { label: string }) {
  return (
    <div className="grid h-40 place-items-center rounded-xl bg-cream/40 text-center">
      <p className="max-w-64 text-xs text-muted">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Submissions over time — area/line, single green series          */
/* ------------------------------------------------------------------ */
export function SubmissionsOverTime({ subs }: { subs: Submission[] }) {
  const data = useMemo(() => monthlyCounts(subs, 6), [subs]);
  const total = data.reduce((s, d) => s + d.value, 0);
  const [hover, setHover] = useState<number | null>(null);

  const W = 520;
  const H = 180;
  const padX = 8;
  const padY = 16;
  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = (W - padX * 2) / Math.max(1, data.length - 1);
  const x = (i: number) => padX + i * stepX;
  const y = (v: number) => H - padY - (v / max) * (H - padY * 2);

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.value)}`).join(" ");
  const areaPath = `${linePath} L ${x(data.length - 1)} ${H - padY} L ${x(0)} ${H - padY} Z`;

  return (
    <Card title="Submissions over time" subtitle="Last 6 months">
      {total === 0 ? (
        <EmptyPlot label="No submissions yet — your monthly activity will chart here." />
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            role="img"
            aria-label="Submissions per month for the last six months"
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GREEN} stopOpacity="0.22" />
                <stop offset="100%" stopColor={GREEN} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* baseline */}
            <line x1={padX} y1={H - padY} x2={W - padX} y2={H - padY} stroke={LINE} strokeWidth="1" />

            <path d={areaPath} fill="url(#areaFill)" />
            <path d={linePath} fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {data.map((d, i) => (
              <g key={d.label}>
                {/* hover hit area */}
                <rect
                  x={x(i) - stepX / 2}
                  y={0}
                  width={stepX}
                  height={H}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                />
                <circle
                  cx={x(i)}
                  cy={y(d.value)}
                  r={hover === i ? 5 : 3.5}
                  fill="#fff"
                  stroke={GREEN}
                  strokeWidth="2"
                />
              </g>
            ))}
          </svg>

          {/* month labels */}
          <div className="mt-2 flex justify-between px-1 text-[11px] text-muted">
            {data.map((d) => (
              <span key={d.label}>{d.label}</span>
            ))}
          </div>

          {hover !== null && (
            <div className="pointer-events-none mt-1 text-center text-xs font-semibold text-ink">
              {data[hover].label}: {data[hover].value} submission
              {data[hover].value === 1 ? "" : "s"}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Pipeline by stage — horizontal bars, sequential green ramp      */
/* ------------------------------------------------------------------ */
const STAGE_ORDER: SubmissionStatus[] = [
  "submitted",
  "screening",
  "approved",
  "client_review",
  "hired",
];
const GREEN_RAMP = ["#a7dcc3", "#6fc79e", "#3fb27f", "#1e9e63", GREEN_DARK];

export function PipelineByStage({ subs }: { subs: Submission[] }) {
  const counts = useMemo(() => {
    const map = new Map<SubmissionStatus, number>();
    for (const s of subs) map.set(s.status, (map.get(s.status) ?? 0) + 1);
    return STAGE_ORDER.map((st) => ({ status: st, value: map.get(st) ?? 0 }));
  }, [subs]);
  const total = counts.reduce((s, d) => s + d.value, 0);
  const max = Math.max(1, ...counts.map((d) => d.value));
  const [hover, setHover] = useState<string | null>(null);

  return (
    <Card title="Pipeline by stage" subtitle="Where your candidates are">
      {total === 0 ? (
        <EmptyPlot label="No candidates in the pipeline yet." />
      ) : (
        <div className="space-y-3">
          {counts.map((d, i) => (
            <div
              key={d.status}
              onMouseEnter={() => setHover(d.status)}
              onMouseLeave={() => setHover(null)}
            >
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-ink">
                  {SUBMISSION_STATUS_LABEL[d.status]}
                </span>
                <span className="text-muted">{d.value}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-cream">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(d.value / max) * 100}%`,
                    background: GREEN_RAMP[i],
                    opacity: hover && hover !== d.status ? 0.55 : 1,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Outcomes — donut, reserved status colors + legend + labels      */
/* ------------------------------------------------------------------ */
export function OutcomesDonut({ subs }: { subs: Submission[] }) {
  const segments = useMemo(() => {
    const hired = subs.filter((s) => s.status === "hired").length;
    const rejected = subs.filter((s) => s.status === "rejected").length;
    const active = subs.length - hired - rejected;
    return [
      { label: "Hired", value: hired, color: GREEN },
      { label: "In progress", value: active, color: GOLD },
      { label: "Not progressed", value: rejected, color: CORAL },
    ];
  }, [subs]);
  const total = segments.reduce((s, d) => s + d.value, 0);

  const R = 52;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <Card title="Outcomes" subtitle="Across all your submissions">
      {total === 0 ? (
        <EmptyPlot label="No outcomes to show yet." />
      ) : (
        <div className="flex flex-col items-center gap-6">
          <svg viewBox="0 0 140 140" className="h-40 w-40 shrink-0" role="img" aria-label="Outcome breakdown">
            <g transform="translate(70 70) rotate(-90)">
              <circle r={R} fill="none" stroke={LINE} strokeWidth="16" />
              {segments.map((s) => {
                if (s.value === 0) return null;
                const frac = s.value / total;
                const dash = frac * C;
                const el = (
                  <circle
                    key={s.label}
                    r={R}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="16"
                    strokeDasharray={`${dash} ${C - dash}`}
                    strokeDashoffset={-offset}
                    // 2px surface gap between adjacent segments
                    strokeLinecap="butt"
                  />
                );
                offset += dash;
                return el;
              })}
            </g>
            <text x="70" y="66" textAnchor="middle" className="fill-ink" style={{ fontSize: 22, fontWeight: 800 }}>
              {total}
            </text>
            <text x="70" y="84" textAnchor="middle" style={{ fontSize: 9, fill: MUTED, letterSpacing: 0.5 }}>
              TOTAL
            </text>
          </svg>

          <ul className="grid w-full grid-cols-2 gap-x-3 gap-y-2">
            {segments.map((s) => (
              <li key={s.label} className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-sm"
                  style={{ background: s.color }}
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold leading-tight text-ink">
                    {s.value}
                  </span>
                  <span className="block truncate text-[10px] uppercase tracking-wide text-muted">
                    {s.label}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Earnings over time — bars, one series (hired fee amounts)       */
/* ------------------------------------------------------------------ */
export function EarningsOverTime({ subs }: { subs: Submission[] }) {
  const data = useMemo(() => monthlyEarnings(subs, 6), [subs]);
  const total = data.reduce((s, d) => s + d.value, 0);
  const max = Math.max(1, ...data.map((d) => d.value));
  const [hover, setHover] = useState<number | null>(null);

  return (
    <Card title="Earnings over time" subtitle="Fee on candidates hired, last 6 months">
      {total === 0 ? (
        <EmptyPlot label="No placements yet — your monthly earnings will chart here." />
      ) : (
        <div>
          <div className="flex h-40 items-end gap-3">
            {data.map((d, i) => (
              <div
                key={d.label}
                className="flex flex-1 flex-col items-center gap-2"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <span className="text-[11px] font-semibold text-ink">
                  {d.value > 0 ? `$${d.value.toLocaleString()}` : ""}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-lg transition-opacity"
                    style={{
                      height: `${Math.max(4, (d.value / max) * 100)}%`,
                      background: GREEN,
                      opacity: hover !== null && hover !== i ? 0.55 : 1,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between px-1 text-[11px] text-muted">
            {data.map((d) => (
              <span key={d.label}>{d.label}</span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ---- helpers ---- */
function monthlyEarnings(subs: Submission[], months: number) {
  const now = new Date();
  const buckets: { key: string; label: string; value: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString("en", { month: "short" }),
      value: 0,
    });
  }
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const s of subs) {
    if (s.status !== "hired") continue;
    const t = toDate(s.createdAt);
    if (!t) continue;
    const key = `${t.getFullYear()}-${t.getMonth()}`;
    const i = index.get(key);
    if (i !== undefined) buckets[i].value += feeTierAmount(s.feeTier) ?? 0;
  }
  return buckets;
}

function monthlyCounts(subs: Submission[], months: number) {
  const now = new Date();
  const buckets: { key: string; label: string; value: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString("en", { month: "short" }),
      value: 0,
    });
  }
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const s of subs) {
    const t = toDate(s.createdAt);
    if (!t) continue;
    const key = `${t.getFullYear()}-${t.getMonth()}`;
    const i = index.get(key);
    if (i !== undefined) buckets[i].value += 1;
  }
  return buckets;
}
