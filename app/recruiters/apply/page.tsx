"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Container, Eyebrow } from "@/components/ui";

const perks = [
  {
    title: "Funded, real roles",
    body: "Every role in the network is briefed and paying a bounty — no cold job posts or dead leads.",
  },
  {
    title: "Keep a strong split",
    body: "Earn a competitive share of the fee on every confirmed hire, paid promptly.",
  },
  {
    title: "We handle the client",
    body: "You focus on finding great people; we manage the relationship, screening, and admin.",
  },
];

const steps = [
  "Create your recruiter account",
  "Browse open roles and their bounties",
  "Submit your best candidates to our team",
  "Get paid when your candidate is hired",
];

export default function RecruiterApplyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-cream">
        <Container className="py-16 lg:py-24">
          <div className="max-w-2xl">
            <Eyebrow>For recruiters</Eyebrow>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Join the Metro Opportunities network
            </h1>
            <p className="mt-4 text-muted">
              Bring the candidates, we&apos;ll bring the roles. Get matched to
              funded, well-defined positions and earn on every hire.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-pill bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Create recruiter account
              </Link>
              <Link
                href="/login"
                className="rounded-pill border border-line px-6 py-3 text-sm font-semibold text-ink hover:bg-black/[0.02]"
              >
                I already have an account
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {perks.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-line bg-white p-6"
              >
                <h2 className="font-bold text-ink">{p.title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-muted">{p.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 rounded-3xl bg-ink px-8 py-10 text-white sm:px-12">
            <h2 className="text-2xl font-extrabold tracking-tight">
              How it works
            </h2>
            <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s}>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-lime text-sm font-bold text-ink">
                    {i + 1}
                  </span>
                  <p className="mt-3 text-sm text-white/70">{s}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
