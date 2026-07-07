"use client";

import { JobWizard } from "@/components/admin/JobWizard";

export default function NewJobPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">
          Add new job
        </h1>
        <p className="mt-1 text-sm text-muted">
          Add a role for the recruiter network to source against.
        </p>
      </div>
      <JobWizard />
    </div>
  );
}
