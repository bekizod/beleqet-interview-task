"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import JobCard from "./JobCard";
import { useGetJobQuery } from "@/lib/store/slices/jobsApiSlice";

// Local storage key for saved jobs
const SAVED_JOBS_KEY = "savedJobs";

export default function FeaturedJobs() {
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);

  useEffect(() => {
    // Load saved job IDs from localStorage
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(SAVED_JOBS_KEY);
    if (saved) {
      try {
        setSavedJobIds(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved jobs from localStorage", e);
        setSavedJobIds([]);
      }
    }
  }, []);

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {savedJobIds.length > 0 ? (
            savedJobIds.map((jobId) => <SavedJobCard key={jobId} jobId={jobId} />)
          ) : (
            <p className="text-muted text-sm col-span-full">No saved jobs yet. Save jobs to see them here!</p>
          )}
        </div>
      </div>
    </section>
  );
}

function SavedJobCard({ jobId }: { jobId: string }) {
  const { data: job, isLoading, isError } = useGetJobQuery(jobId);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-pageBg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (isError || !job) {
    return null; // Skip jobs that fail to load
  }

  return <JobCard job={job} />;
}
