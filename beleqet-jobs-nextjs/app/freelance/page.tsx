'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useGetFreelanceJobsQuery } from '@/lib/store/slices/freelanceApiSlice';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGetProfileQuery } from '@/lib/store/slices/usersApiSlice';
import { Plus, Briefcase, FileText, LayoutDashboard } from 'lucide-react';

export default function FreelancePage() {
  const { user, isAuthenticated } = useAuth();
  const { data: profile } = useGetProfileQuery(undefined, { skip: !isAuthenticated });
  const isEmployer = profile?.role === 'EMPLOYER' || profile?.role === 'ADMIN';

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading, isError } = useGetFreelanceJobsQuery({
    q: query || undefined,
    category: category || undefined,
    page: 1,
    limit: 20,
  });

  const jobs = data?.items ?? [];

  const categories = useMemo(
    () =>
      Array.from(
        new Map(
          jobs.map((job) => [job.category.slug, job.category])
        ).values()
      ),
    [jobs]
  );

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-pageH1">Freelance marketplace</h1>
        <p className="text-muted text-sm mt-2">
          Browse available freelance gigs and submit bids directly from your account.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        {isEmployer && (
          <Link
            href="/freelance/create"
            className="inline-flex items-center gap-2 rounded-lg bg-brandGreen px-4 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
          >
            <Plus className="h-4 w-4" />
            Post a Gig
          </Link>
        )}

        {isAuthenticated && (
          <>
            <Link
              href="/freelance/contracts"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-pageBg transition-colors"
            >
              <FileText className="h-4 w-4" />
              My Contracts
            </Link>
            <Link
              href="/freelance/my-bids"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-pageBg transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              My Bids
            </Link>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_280px] mb-8">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search gigs by title or keyword"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-ink outline-none focus:border-brandGreen focus:ring-brandGreen/20"
          />
        </div>
        <div className="rounded-2xl border border-border bg-white p-4">
          <h2 className="text-sm font-semibold text-ink mb-3">Categories</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={`rounded-full border px-3 py-2 text-sm transition ${category === '' ? 'border-brandGreen bg-brandGreen/10 text-brandGreen' : 'border-gray-200 text-muted hover:border-brandGreen hover:text-brandGreen'}`}
            >
              All
            </button>
            {categories.map((categoryItem) => (
              <button
                key={categoryItem.id}
                type="button"
                onClick={() => setCategory(categoryItem.slug)}
                className={`rounded-full border px-3 py-2 text-sm transition ${category === categoryItem.slug ? 'border-brandGreen bg-brandGreen/10 text-brandGreen' : 'border-gray-200 text-muted hover:border-brandGreen hover:text-brandGreen'}`}
              >
                {categoryItem.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-muted">
            Loading gigs...
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
            Failed to load freelance gigs. Please try again.
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-muted">
            No freelance gigs found.
          </div>
        ) : (
          jobs.map((job) => (
            <Link
              key={job.id}
              href={`/freelance/jobs/${job.id}`}
              className="block rounded-2xl border border-border bg-white p-6 hover:border-brandGreen/30 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-brandGreen font-semibold">{job.category.label}</p>
                  <h2 className="mt-2 text-xl font-semibold text-ink">{job.title}</h2>
                  <p className="mt-3 text-sm text-muted line-clamp-3">{job.description}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-ink font-semibold">{job.budgetMin.toLocaleString()} - {job.budgetMax.toLocaleString()} ETB</p>
                  <p className="text-muted mt-2">{job.status.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                <span>{job.skills.join(', ')}</span>
                <span>Client: {job?.client?.firstName} {job?.client?.lastName}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
