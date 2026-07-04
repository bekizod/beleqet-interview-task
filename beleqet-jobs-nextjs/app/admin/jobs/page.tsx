'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useGetJobsQuery, useAdminFeatureJobMutation } from '@/lib/store/slices/jobsApiSlice';
import { Star, Search, Building2, MapPin, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminJobsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [featureJob] = useAdminFeatureJobMutation();

  const { data, isLoading } = useGetJobsQuery(
    { q: search || undefined, limit: 100 },
    { skip: !isAuthenticated || user?.role !== 'ADMIN' },
  );

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-muted">Admin access required.</p>
        <button onClick={() => router.push('/login')}
          className="mt-4 text-sm font-semibold text-brandGreen hover:underline">
          Sign in
        </button>
      </div>
    );
  }

  const handleToggle = async (id: string, currentFeatured: boolean) => {
    try {
      const result = await featureJob({ id, featured: !currentFeatured }).unwrap();
      toast.success(result.message);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update featured status.');
    }
  };

  const jobs = data?.items ?? [];
  const filtered = jobs.filter(j =>
    !search ||
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <h1 className="text-pageH1">Manage Featured Jobs</h1>
        <p className="text-muted text-sm mt-1">
          Toggle the star to feature or un-feature a job. Featured jobs appear on the homepage.
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 mb-6 max-w-md">
        <Search className="h-4 w-4 text-muted shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or company..."
          className="w-full text-sm text-ink placeholder:text-muted outline-none"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-white p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted text-sm">No jobs found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-pageBg border-b border-border">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Job</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted hidden sm:table-cell">Company</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted hidden md:table-cell">Applications</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted">Featured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(job => (
                <tr key={job.id} className="hover:bg-pageBg/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-ink line-clamp-1">{job.title}</p>
                    <div className="flex items-center gap-1 text-xs text-muted mt-0.5 sm:hidden">
                      <Building2 className="h-3 w-3" />
                      {job.company.name}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {job.location}
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-ink">{job.company.name}</span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-1 text-muted">
                      <Users className="h-3.5 w-3.5" />
                      {job._count.applications}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      job.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                      job.status === 'DRAFT'     ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => handleToggle(job.id, job.featured)}
                      title={job.featured ? 'Remove from featured' : 'Mark as featured'}
                      className="inline-flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-yellow-50"
                    >
                      <Star
                        className={`h-5 w-5 transition-colors ${
                          job.featured
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-300'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
