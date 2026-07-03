"use client";

import { JobForm } from "@/components/admin/JobForm";

export default function NewJobPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">
          Post a job
        </h1>
        <p className="mt-1 text-sm text-muted">
          Add a role for the recruiter network to source against.
        </p>
      </div>
      <JobForm />
    </div>
  );
}
