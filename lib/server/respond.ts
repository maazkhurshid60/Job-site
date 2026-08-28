import "server-only";
import { NextResponse } from "next/server";
import { AuthError } from "./auth";

/* Uniform JSON responses and error handling for every API route.

   The important behaviour here is that internal errors never reach the client:
   a MySQL error message can leak table names, column names, and occasionally
   the query's bound values — which for this app would mean candidate data in a
   browser console. Only AuthError and BadRequest messages are passed through. */

export class BadRequest extends Error {
  readonly status = 400 as const;
}

export class NotFound extends Error {
  readonly status = 404 as const;
  constructor(message = "Not found.") {
    super(message);
  }
}

/** Rate limit hit — see countRecentMessagesFromIp() in lib/server/repo.ts,
    used by the contact form. */
export class TooManyRequests extends Error {
  readonly status = 429 as const;
  constructor(message = "Too many requests. Please try again shortly.") {
    super(message);
  }
}

/* A deployment is misconfigured — a required environment variable is missing.
 *
 * This is worth its own class because it is the one 500 whose message is safe
 * to show: it names a config key, never a query, a table, or candidate data.
 * Masking it as "Something went wrong." cost real time — a missing
 * FILE_URL_SECRET made the admin submissions list 500 the moment the first CV
 * was uploaded, and the generic text pointed at nothing.
 *
 * Routes that throw this are all behind requireUid/requireAdmin, so the text
 * only ever reaches a signed-in operator. */
export class ConfigError extends Error {
  readonly status = 500 as const;
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/** Wrap a route handler so thrown errors become sensible JSON responses. */
export function handle<T>(fn: () => Promise<T>) {
  return fn().catch((err: unknown) => {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof BadRequest || err instanceof NotFound || err instanceof TooManyRequests) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof ConfigError) {
      // Still log it: this one always needs someone to go and fix a deployment.
      console.error("[api] configuration error:", err.message);
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    // Anything else is ours, not the caller's. Log the detail server-side and
    // return something deliberately uninformative.
    console.error("[api]", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }) as Promise<NextResponse>;
}

/** Parse a JSON body, rejecting anything that isn't an object. */
export async function jsonBody(req: Request): Promise<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    throw new BadRequest("Body must be valid JSON.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new BadRequest("Body must be a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

/* --- field coercion -------------------------------------------------------
   Client input is untrusted. These normalise rather than trust, so a number
   arriving as a string, or a missing optional, can't reach a query as NaN or
   undefined (which mysql2 rejects at bind time). */

export function str(value: unknown, field: string, { max = 65535, required = false } = {}): string {
  if (value === undefined || value === null) {
    if (required) throw new BadRequest(`${field} is required.`);
    return "";
  }
  if (typeof value !== "string") throw new BadRequest(`${field} must be a string.`);
  const trimmed = value.trim();
  if (required && !trimmed) throw new BadRequest(`${field} is required.`);
  if (trimmed.length > max) throw new BadRequest(`${field} is too long.`);
  return trimmed;
}

export function intOrNull(value: unknown, field: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) throw new BadRequest(`${field} must be a number.`);
  return Math.trunc(n);
}

export function bool(value: unknown): boolean {
  return value === true || value === "true" || value === 1;
}

export function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
  fallback?: T,
): T {
  if (typeof value === "string" && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  if (fallback !== undefined) return fallback;
  throw new BadRequest(`${field} must be one of: ${allowed.join(", ")}.`);
}

/** JSON columns: accept an array, store it, reject anything else. */
export function jsonArray(value: unknown, field: string): string {
  if (value === undefined || value === null) return "[]";
  if (!Array.isArray(value)) throw new BadRequest(`${field} must be an array.`);
  return JSON.stringify(value);
}
