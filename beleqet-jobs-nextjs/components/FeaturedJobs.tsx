"use client";

import Link from "next/link";
import JobCard from "./JobCard";
import { useGetFeaturedJobsQuery } from "@/lib/store/slices/jobsApiSlice";

export default function FeaturedJobs() {
  const { data: jobs = [], isLoading, isError } = useGetFeaturedJobsQuery(10);

  return (
    <section className="bg-white border-y border-border">
      <div className="container-page py-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-sectionH2">Featured Jobs</h2>
            <p className="text-muted text-sm mt-1">Fresh opportunities from companies hiring right now.</p>
          </div>
          <Link href="/jobs" className="hidden sm:inline-block text-sm font-semibold text-brandGreen hover:underline shrink-0">
            View all jobs →
          </Link>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-white p-5 animate-pulse">
                <div className="flex justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-200" />
                  <div className="h-4 w-4 rounded bg-gray-200" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-muted">Unable to load featured jobs.</p>
        )}

        {!isLoading && !isError && jobs.length === 0 && (
          <p className="text-sm text-muted">No featured jobs at the moment. Check back soon.</p>
        )}

        {!isLoading && !isError && jobs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
