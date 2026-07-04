'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, Clock, Building2, Users, Briefcase,
  DollarSign, Globe, Edit, Trash2, Eye,
  Star, Calendar, AlertCircle,
} from 'lucide-react';
import { useGetJobQuery } from '@/lib/store/slices/jobsApiSlice';
import { useGetJobApplicationsQuery, useUpdateApplicationStatusMutation } from '@/lib/store/slices/applicationsApiSlice';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  SUBMITTED:           'bg-blue-100 text-blue-700',
  SCREENING:           'bg-purple-100 text-purple-700',
  SHORTLISTED:         'bg-green-100 text-green-700',
  INTERVIEW_SCHEDULED: 'bg-indigo-100 text-indigo-700',
  OFFERED:             'bg-emerald-100 text-emerald-700',
  REJECTED:            'bg-red-100 text-red-600',
  WITHDRAWN:           'bg-gray-100 text-gray-500',
};

const jobStatusColors: Record<string, string> = {
  PUBLISHED: 'bg-green-100 text-green-700',
  DRAFT:     'bg-yellow-100 text-yellow-700',
  CLOSED:    'bg-gray-100 text-gray-600',
  ARCHIVED:  'bg-red-100 text-red-600',
};

export default function MyJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { isAuthenticated, accessToken } = useAuth();

  const { data: job, isLoading, isError } = useGetJobQuery(jobId);
  const { data: applications, isLoading: appsLoading } = useGetJobApplicationsQuery(jobId, {
    skip: !isAuthenticated,
  });
  const [updateStatus] = useUpdateApplicationStatusMutation();

  // Chat state — which applicant are we chatting with
  const [chatTarget, setChatTarget] = useState<{ userId: string; name: string } | null>(null);
  const handleStatusUpdate = async (applicationId: string, status: string) => {
    try {
      await updateStatus({ id: applicationId, status: status as any }).unwrap();
      toast.success('Status updated');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update status');
    }
  };

  const formatType = (type: string) => type.replace(/_/g, ' ');

  const postedAgo = job
    ? (() => {
        const days = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        return `${Math.floor(days / 30)} months ago`;
      })()
    : '';

  const salaryLabel =
    job?.salaryMin && job?.salaryMax
      ? `${job.currency || 'ETB'} ${job.salaryMin.toLocaleString()} – ${job.salaryMax.toLocaleString()}`
      : job?.salaryMin
        ? `From ${job.currency || 'ETB'} ${job.salaryMin.toLocaleString()}`
        : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="font-semibold text-gray-900">Job not found</p>
        <Link href="/my-jobs" className="text-sm text-green-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to My Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* ── Back + action bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/my-jobs" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> Back to My Jobs
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/my-jobs/${jobId}/applications`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Users className="h-4 w-4" />
              All Applications ({job._count?.applications ?? 0})
            </Link>
            {/* <Link
              href={`/post-job?edit=${jobId}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Edit className="h-4 w-4" /> Edit
            </Link> */}
          </div>
        </div>

        {/* ── Job detail card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-7">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-gray-400 shrink-0">
              <Building2 className="h-6 w-6" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-gray-900 leading-snug">{job.title}</h1>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${jobStatusColors[job.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {job.status}
                </span>
                {job.urgent && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600">
                    Urgent
                  </span>
                )}
              </div>
              <p className="text-gray-500 mt-0.5">{job.company.name}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Posted {postedAgo}</span>
                <span className="rounded-full bg-green-50 text-green-700 font-semibold px-2.5 py-1">{formatType(job.type)}</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{job._count?.applications ?? 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">Applicants</p>
            </div>
            {job.vacancies && (
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{job.vacancies}</p>
                <p className="text-xs text-gray-500 mt-0.5">Vacancies</p>
              </div>
            )}
            {salaryLabel && (
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center col-span-2">
                <p className="text-lg font-bold text-gray-900">{salaryLabel}</p>
                <p className="text-xs text-gray-500 mt-0.5">Salary Range</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Job Description</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>

          {job.requirements && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Requirements</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
            </div>
          )}

          {/* Extra details */}
          <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {job.experienceLevel && (
              <div>
                <p className="text-gray-400 text-xs">Experience</p>
                <p className="font-medium text-gray-800">{job.experienceLevel}</p>
              </div>
            )}
            {job.qualification && (
              <div>
                <p className="text-gray-400 text-xs">Qualification</p>
                <p className="font-medium text-gray-800">{job.qualification}</p>
              </div>
            )}
            {job.deadline && (
              <div>
                <p className="text-gray-400 text-xs">Deadline</p>
                <p className="font-medium text-gray-800">{new Date(job.deadline).toLocaleDateString()}</p>
              </div>
            )}
            {job.jobSite && (
              <div>
                <p className="text-gray-400 text-xs">Job Site</p>
                <p className="font-medium text-gray-800">{job.jobSite}</p>
              </div>
            )}
            {job.gender && (
              <div>
                <p className="text-gray-400 text-xs">Gender</p>
                <p className="font-medium text-gray-800">{job.gender}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {job.tags.map((tag) => (
                <span key={tag} className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Applications section ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">
              Recent Applications
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({applications?.length ?? 0})
              </span>
            </h2>
            <Link
              href={`/my-jobs/${jobId}/applications`}
              className="text-sm text-green-600 hover:underline font-medium"
            >
              View All →
            </Link>
          </div>

          {appsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
            </div>
          ) : !applications || applications.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No applications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="px-6 py-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-green-700">
                      {app.user.firstName[0]}{app.user.lastName[0]}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {app.user.firstName} {app.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{app.user.email}</p>
                  </div>

                  {/* AI Score */}
                  {app.score && (
                    <div className="hidden sm:flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full shrink-0">
                      <Star className="h-3 w-3" />
                      {app.score.overallScore.toFixed(0)}
                    </div>
                  )}

                  {/* Status badge */}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${statusColors[app.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {app.status.replace(/_/g, ' ')}
                  </span>

                  {/* Status selector */}
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                    className="hidden sm:block text-xs px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-green-500 bg-white shrink-0"
                  >
                    <option value="SUBMITTED">Submitted</option>
                    <option value="SCREENING">Screening</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                    <option value="OFFERED">Offered</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
