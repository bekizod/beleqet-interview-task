import Link from "next/link";
import { jobs } from "@/lib/mockData";
import JobCard from "./JobCard";
import type { Job } from "@/lib/store/slices/jobsApiSlice";
import { JobType, JobStatus } from "@/lib/store/slices/jobsApiSlice";

// Map mock job type strings to the JobType enum
const typeMap: Record<string, JobType> = {
  "Full Time": JobType.FULL_TIME,
  "Part Time": JobType.PART_TIME,
  "Remote": JobType.REMOTE,
  "Hybrid": JobType.HYBRID,
  "Contract": JobType.CONTRACT,
  "On-site": JobType.FULL_TIME,
};

// Convert "2h ago" / "1d ago" style strings into milliseconds for createdAt
function parseMockAge(postedAgo: string): number {
  const match = postedAgo.match(/^(\d+)(h|d)$/);
  if (!match) return 0;
  const n = parseInt(match[1], 10);
  return match[2] === "h" ? n * 3_600_000 : n * 86_400_000;
}

export default function FeaturedJobs() {
  const featured: Job[] = jobs
    .filter((j) => j.featured)
    .map((j) => ({
      id: j.id,
      title: j.title,
      description: j.description ?? "",
      location: j.location,
      type: typeMap[j.type] ?? JobType.FULL_TIME,
      categoryId: j.category,
      currency: "ETB",
      status: JobStatus.PUBLISHED,
      featured: j.featured ?? false,
      companyId: j.company,
      filled: false,
      urgent: false,
      createdAt: new Date(Date.now() - parseMockAge(j.postedAgo)).toISOString(),
      updatedAt: new Date().toISOString(),
      tags: j.tags,
      company: {
        id: j.company,
        name: j.company,
        verified: false,
        userId: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      category: {
        id: j.category,
        slug: j.category,
        label: j.category,
      },
      _count: { applications: 0 },
    }));

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
          {featured.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </section>
  );
}
