"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getJob, type Job } from "@/lib/jobs";
import { adminRoutes } from "@/lib/routes";
import { JobForm } from "@/components/admin/JobForm";
import { Loader } from "@/components/Loader";

export default function EditJobPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [job, setJob] = useState<Job | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    let active = true;
    getJob(id)
      .then((j) => {
        if (!active) return;
        setJob(j);
        setState(j ? "ready" : "missing");
      })
      .catch(() => active && setState("missing"));
    return () => {
      active = false;
    };
  }, [id]);

  if (state === "loading") {
    return (
      <div className="grid h-64 place-items-center">
        <Loader />
      </div>
    );
  }

  if (state === "missing" || !job) {
    return (
      <div className="rounded-2xl border border-line bg-white p-10 text-center">
        <p className="text-sm text-muted">That job could not be found.</p>
        <Link
          href={adminRoutes.base}
          className="mt-4 inline-block text-sm font-semibold text-primary"
        >
          ← Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">
          Edit job
        </h1>
        <p className="mt-1 text-sm text-muted">{job.title}</p>
      </div>
      <JobForm job={job} />
    </div>
  );
}
