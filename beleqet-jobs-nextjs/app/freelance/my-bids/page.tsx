'use client';

import Link from 'next/link';
import { useGetMyBidsQuery } from '@/lib/store/slices/freelanceApiSlice';

export default function FreelanceMyBidsPage() {
  const { data, isLoading, isError } = useGetMyBidsQuery();

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-pageH1">My freelance bids</h1>
        <p className="text-muted text-sm mt-2">Track the status of the bids you submitted as a freelancer.</p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6">
        {isLoading ? (
          <div className="text-center text-sm text-muted">Loading your bids…</div>
        ) : isError ? (
          <div className="text-center text-sm text-red-600">Unable to load your bids. Please refresh.</div>
        ) : !data || data.length === 0 ? (
          <div className="text-center text-sm text-muted">You have not submitted any bids yet.</div>
        ) : (
          <div className="space-y-4">
            {data.map((bid) => (
              <div key={bid.id} className="rounded-2xl border border-border bg-pageBg p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link href={`/freelance/jobs/${bid.freelanceJobId}`} className="text-lg font-semibold text-brandGreen hover:text-darkGreen">
                      {bid.freelanceJob?.title ?? 'Freelance gig'}
                    </Link>
                    <p className="text-sm text-muted mt-1">{bid.freelanceJob?.category.label ?? 'Freelance'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">{bid.amount.toLocaleString()} ETB</p>
                    <p className="text-sm text-muted">{bid.timelineDays} days</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">{bid.status}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted">{bid.coverLetter}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
