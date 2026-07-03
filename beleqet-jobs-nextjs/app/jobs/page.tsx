import { Suspense } from "react";
import JobsListing from "@/components/JobsListing";
import EmployerRedirect from "@/components/EmployerRedirect";

export const metadata = {
  title: "Find Jobs | Beleqet Jobs",
};

export default function JobsPage() {
  return (
    <EmployerRedirect>
      <Suspense fallback={<div className="container-page py-20 text-center text-muted">Loading jobs…</div>}>
        <JobsListing />
      </Suspense>
    </EmployerRedirect>
  );
}
