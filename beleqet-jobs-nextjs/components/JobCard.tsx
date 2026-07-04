import Link from "next/link";
import { MapPin, Bookmark, Building2, Star } from "lucide-react";
import type { Job } from "@/lib/store/slices/jobsApiSlice";

const typeStyles: Record<string, string> = {
  "FULL_TIME": "bg-brandGreen/10 text-brandGreen",
  "PART_TIME": "bg-purpleAccent/10 text-purpleAccent",
  "REMOTE": "bg-cyanAccent/10 text-cyanAccent",
  "HYBRID": "bg-orangeAccent/10 text-orangeAccent",
  "CONTRACT": "bg-redAccent/10 text-redAccent",
};

export default function JobCard({ job }: { job: Job }) {
  const formatType = (type: string) => type.replace('_', ' ');
  const formatPostedAgo = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const days = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex flex-col rounded-xl border border-border bg-white p-5 hover:border-brandGreen hover:shadow-card transition-all"
    >
      <div className="flex items-start justify-between">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-pageBg text-muted">
          <Building2 className="h-5 w-5" />
        </span>
        <div className="flex items-center gap-2">
          {job.featured && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
              <Star className="h-3 w-3 fill-yellow-700" />
              Featured
            </span>
          )}
          <Bookmark
            className={`h-4 w-4 transition-colors ${
              job.featured
                ? "fill-brandGreen text-brandGreen"
                : "text-muted/50 group-hover:text-brandGreen"
            }`}
          />
        </div>
      </div>

      <h3 className="text-cardH3 mt-3 text-ink leading-snug line-clamp-2">{job.title}</h3>
      <p className="text-sm text-muted mt-1">{job.company.name}</p>

      <div className="flex items-center gap-1 text-xs text-muted mt-2">
        <MapPin className="h-3.5 w-3.5" />
        {job.location}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${typeStyles[job.type] ?? "bg-muted/10 text-muted"}`}>
          {formatType(job.type)}
        </span>
        <span className="text-[11px] text-muted">{formatPostedAgo(job.createdAt)}</span>
      </div>
    </Link>
  );
}
