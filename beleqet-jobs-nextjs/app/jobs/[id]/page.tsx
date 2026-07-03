'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Clock, Building2, ArrowLeft, Briefcase, DollarSign, Users, Globe, AlertCircle, CheckCircle, Bookmark, BookmarkCheck, SendHorizonal, Search, Star, CalendarClock, Gift, XCircle, Undo2 } from 'lucide-react';
import { useGetJobQuery } from '@/lib/store/slices/jobsApiSlice';
import { useSubmitApplicationMutation, useGetMyApplicationsQuery } from '@/lib/store/slices/applicationsApiSlice';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGetProfileQuery } from '@/lib/store/slices/usersApiSlice';
import Cookies from "js-cookie";
export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const { isAuthenticated } = useAuth();
  const { data: profile } = useGetProfileQuery(undefined, { skip: !isAuthenticated });
  const isEmployer = profile?.role === 'EMPLOYER' || profile?.role === 'ADMIN';

  // Redirect employers away — they should not access job seeker pages
  useEffect(() => {
    if (isEmployer) router.replace('/my-jobs');
  }, [isEmployer, router]);

  const { data: job, isLoading, isError } = useGetJobQuery(jobId);
  const [submitApplication, { isLoading: isSubmitting }] = useSubmitApplicationMutation();

  // Check if user already applied to this job
  const { data: myApplications } = useGetMyApplicationsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const existingApplication = myApplications?.find((a) => a.jobId === jobId);
  const alreadyApplied = !!existingApplication;

  // Save job — persisted in localStorage (no backend model exists yet)
  const [isSaved, setIsSaved] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved: string[] = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    setIsSaved(saved.includes(jobId));
  }, [jobId]);

  const toggleSaveJob = () => {
    if (typeof window === 'undefined') return;
    const saved: string[] = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    const updated = isSaved ? saved.filter((id) => id !== jobId) : [...saved, jobId];
    localStorage.setItem('savedJobs', JSON.stringify(updated));
    setIsSaved(!isSaved);
  };

  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState('');

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError('');

    if (!isAuthenticated) {
      router.push(`/login?redirect=/jobs/${jobId}`);
      return;
    }

    try {
      await submitApplication({
        jobId,
        coverLetter: coverLetter || undefined,
        resumeUrl: resumeUrl || undefined,
        portfolioUrl: portfolioUrl || undefined,
        expectedSalary: expectedSalary ? parseInt(expectedSalary, 10) : undefined,
      }).unwrap();
      setApplySuccess(true);
      setShowApplyForm(false);
    } catch (err: any) {
      const message =
        err?.data?.message ||
        (Array.isArray(err?.data?.errors) ? err.data.errors.join(', ') : null) ||
        'Failed to submit application. Please try again.';
      setApplyError(typeof message === 'string' ? message : JSON.stringify(message));
    }
  };

  const formatType = (type: string) => type.replace(/_/g, ' ');

  // Status display config
  const statusConfig: Record<string, { label: string; icon: React.ReactNode; badge: string; bar: string; description: string }> = {
    SUBMITTED:            { label: 'Application Submitted',     icon: <SendHorizonal className="h-6 w-6" />,  badge: 'bg-blue-100 text-blue-700',    bar: 'bg-blue-400',   description: 'Your application has been received and is awaiting review.' },
    SCREENING:            { label: 'Under AI Screening',        icon: <Search className="h-6 w-6" />,         badge: 'bg-purple-100 text-purple-700', bar: 'bg-purple-400', description: 'Our AI is reviewing your profile against the job requirements.' },
    SHORTLISTED:          { label: 'You\'ve Been Shortlisted!', icon: <Star className="h-6 w-6" />,           badge: 'bg-green-100 text-green-700',   bar: 'bg-brandGreen', description: 'Great news! You\'ve made it to the shortlist.' },
    INTERVIEW_SCHEDULED:  { label: 'Interview Scheduled',       icon: <CalendarClock className="h-6 w-6" />,  badge: 'bg-indigo-100 text-indigo-700', bar: 'bg-indigo-400', description: 'An interview has been scheduled. Check your notifications.' },
    OFFERED:              { label: 'Offer Extended! 🎉',        icon: <Gift className="h-6 w-6" />,           badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', description: 'Congratulations! You\'ve received a job offer.' },
    REJECTED:             { label: 'Not Selected',              icon: <XCircle className="h-6 w-6" />,        badge: 'bg-red-100 text-red-600',       bar: 'bg-red-400',    description: 'Unfortunately you weren\'t selected for this role.' },
    WITHDRAWN:            { label: 'Application Withdrawn',     icon: <Undo2 className="h-6 w-6" />,          badge: 'bg-gray-100 text-gray-500',     bar: 'bg-gray-300',   description: 'You have withdrawn your application.' },
  };

  const statusSteps = ['SUBMITTED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED'];
  const currentStepIndex = existingApplication ? statusSteps.indexOf(existingApplication.status) : -1;

  if (isEmployer) return null;

  if (isLoading) {
    return (
      <div className="container-page py-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brandGreen" />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-ink font-semibold text-lg">Job not found</p>
        <p className="text-muted mt-2 text-sm">This job may have been removed or is no longer available.</p>
        <Link href="/jobs" className="mt-6 inline-flex items-center gap-1.5 text-sm text-brandGreen hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to all jobs
        </Link>
      </div>
    );
  }

  const postedAgo = (() => {
    const days = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  })();

  const salaryLabel =
    job.salaryMin && job.salaryMax
      ? `${job.currency || 'ETB'} ${job.salaryMin.toLocaleString()} – ${job.salaryMax.toLocaleString()}`
      : job.salaryMin
        ? `From ${job.currency || 'ETB'} ${job.salaryMin.toLocaleString()}`
        : null;

  return (
    <div className="container-page py-10">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brandGreen mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to all jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* ── Main content ── */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-white p-7">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-pageBg text-muted shrink-0">
                {job.company.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={job.company.logoUrl} alt={job.company.name} className="h-10 w-10 object-contain rounded" />
                ) : (
                  <Building2 className="h-6 w-6" />
                )}
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-ink leading-snug">{job.title}</h1>
                <p className="text-muted mt-1">{job.company.name}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {postedAgo}
                  </span>
                  <span className="rounded-full bg-brandGreen/10 text-brandGreen font-semibold px-2.5 py-1">
                    {formatType(job.type)}
                  </span>
                  {job.urgent && (
                    <span className="rounded-full bg-redAccent/10 text-redAccent font-semibold px-2.5 py-1">
                      Urgent
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {salaryLabel && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <DollarSign className="h-4 w-4 text-brandGreen shrink-0" />
                  <span>{salaryLabel}</span>
                </div>
              )}
              {job.vacancies && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Users className="h-4 w-4 text-brandGreen shrink-0" />
                  <span>{job.vacancies} opening{job.vacancies > 1 ? 's' : ''}</span>
                </div>
              )}
              {job.experienceLevel && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Briefcase className="h-4 w-4 text-brandGreen shrink-0" />
                  <span>{job.experienceLevel}</span>
                </div>
              )}
              {job.jobSite && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Globe className="h-4 w-4 text-brandGreen shrink-0" />
                  <span>{job.jobSite}</span>
                </div>
              )}
            </div>

            <div className="mt-7 pt-7 border-t border-border">
              <h2 className="text-sm font-semibold text-ink mb-3">Job Description</h2>
              <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>

            {job.requirements && (
              <div className="mt-6 pt-6 border-t border-border">
                <h2 className="text-sm font-semibold text-ink mb-3">Requirements</h2>
                <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
              </div>
            )}

            {job.tags && job.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <span key={tag} className="text-xs font-medium text-muted bg-pageBg border border-border rounded-full px-3 py-1">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Apply form ── */}
          {showApplyForm && (
            <div className="rounded-2xl border border-brandGreen bg-white p-7">
              <h2 className="text-base font-bold text-ink mb-5">Submit Your Application</h2>
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    Cover Letter <span className="text-muted font-normal">(optional, min 50 characters)</span>
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={5}
                    placeholder="Tell the employer why you're a great fit for this role..."
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm text-ink placeholder:text-muted outline-none focus:border-brandGreen resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Resume / CV URL <span className="text-muted font-normal">(optional)</span></label>
                  <input
                    type="url"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="https://your-resume-link.com"
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm text-ink placeholder:text-muted outline-none focus:border-brandGreen"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Portfolio URL <span className="text-muted font-normal">(optional)</span></label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://your-portfolio.com"
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm text-ink placeholder:text-muted outline-none focus:border-brandGreen"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Expected Salary <span className="text-muted font-normal">(optional)</span></label>
                  <input
                    type="number"
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(e.target.value)}
                    placeholder="e.g. 50000"
                    min={0}
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm text-ink placeholder:text-muted outline-none focus:border-brandGreen"
                  />
                </div>

                {applyError && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {applyError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-full bg-brandGreen text-white text-sm font-semibold py-3 hover:bg-darkGreen transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting…' : 'Submit Application'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowApplyForm(false); setApplyError(''); }}
                    className="flex-1 rounded-full border border-border text-ink text-sm font-semibold py-3 hover:bg-pageBg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-white p-6">
            {/* ── Already applied state ── */}
            {alreadyApplied && existingApplication ? (() => {
              const cfg = statusConfig[existingApplication.status] ?? statusConfig['SUBMITTED'];
              const isTerminal = existingApplication.status === 'REJECTED' || existingApplication.status === 'WITHDRAWN';
              const isOffered  = existingApplication.status === 'OFFERED';
              return (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 rounded-full p-2 ${cfg.badge}`}>
                      {cfg.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-ink text-sm leading-snug">{cfg.label}</p>
                      <p className="text-xs text-muted mt-0.5">{cfg.description}</p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.badge}`}>
                    Applied {new Date(existingApplication.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>

                  {/* Progress stepper — only for non-terminal statuses */}
                  {!isTerminal && (
                    <div className="pt-1">
                      <div className="flex items-center gap-1">
                        {statusSteps.map((step, i) => (
                          <div key={step} className="flex items-center flex-1">
                            <div className={`h-1.5 flex-1 rounded-full transition-all ${i <= currentStepIndex ? cfg.bar : 'bg-gray-200'}`} />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-1.5">
                        {statusSteps.map((step, i) => (
                          <span key={step} className={`text-[10px] font-medium ${i === currentStepIndex ? 'text-ink' : 'text-muted/60'}`}>
                            {step === 'INTERVIEW_SCHEDULED' ? 'Interview' : step.charAt(0) + step.slice(1).toLowerCase().replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Score (if available) */}
                  {existingApplication.score && (
                    <div className="rounded-xl bg-purple-50 border border-purple-100 p-3 space-y-2">
                      <p className="text-xs font-semibold text-purple-800">AI Screening Score</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { label: 'Overall', value: existingApplication.score.overallScore },
                          { label: 'Skills',  value: existingApplication.score.skillScore },
                          { label: 'Exp.',    value: existingApplication.score.experienceScore },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <div className="text-base font-bold text-purple-700">{value.toFixed(0)}</div>
                            <div className="text-[10px] text-purple-500">{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <Link
                    href="/applications"
                    className={`block w-full text-center rounded-full text-sm font-semibold py-2.5 transition-colors ${isOffered ? 'bg-brandGreen text-white hover:bg-darkGreen' : 'border border-border text-ink hover:bg-pageBg'}`}
                  >
                    {isOffered ? 'View Offer →' : 'Track Application →'}
                  </Link>
                </div>
              );
            })() : applySuccess ? (
              /* ── Just submitted this session ── */
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <CheckCircle className="h-9 w-9 text-brandGreen" />
                <p className="font-semibold text-ink text-sm">Application Submitted!</p>
                <p className="text-xs text-muted">We'll notify you of any updates.</p>
                <Link href="/applications" className="text-xs text-brandGreen hover:underline font-medium">
                  View My Applications →
                </Link>
              </div>
            ) : (
              /* ── Default: apply / login ── */
              <>
                {!isAuthenticated ? (
                  <Link
                    href={`/login?redirect=/jobs/${jobId}`}
                    className="block w-full rounded-full bg-brandGreen text-white text-sm font-semibold py-3 text-center hover:bg-darkGreen transition-colors"
                  >
                    Log in to Apply
                  </Link>
                ) : (
                  <button
                    onClick={() => { setShowApplyForm(!showApplyForm); setApplyError(''); }}
                    className="w-full rounded-full bg-brandGreen text-white text-sm font-semibold py-3 hover:bg-darkGreen transition-colors"
                  >
                    {showApplyForm ? 'Cancel' : 'Apply Now'}
                  </button>
                )}
              </>
            )}

            {/* ── Save Job button ── */}
            <button
              onClick={toggleSaveJob}
              className={`mt-2 w-full flex items-center justify-center gap-2 rounded-full border text-sm font-semibold py-3 transition-colors ${
                isSaved
                  ? 'border-brandGreen bg-brandGreen/5 text-brandGreen hover:bg-brandGreen/10'
                  : 'border-border text-ink hover:bg-pageBg'
              }`}
            >
              {isSaved ? (
                <><BookmarkCheck className="h-4 w-4" /> Saved</>
              ) : (
                <><Bookmark className="h-4 w-4" /> Save Job</>
              )}
            </button>
          </div>

          {/* Job details summary */}
          <div className="rounded-2xl border border-border bg-white p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">Job Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Type</dt>
                <dd className="font-medium text-ink">{formatType(job.type)}</dd>
              </div>
              {job.experienceLevel && (
                <div className="flex justify-between">
                  <dt className="text-muted">Experience</dt>
                  <dd className="font-medium text-ink">{job.experienceLevel}</dd>
                </div>
              )}
              {job.qualification && (
                <div className="flex justify-between">
                  <dt className="text-muted">Qualification</dt>
                  <dd className="font-medium text-ink">{job.qualification}</dd>
                </div>
              )}
              {job.vacancies && (
                <div className="flex justify-between">
                  <dt className="text-muted">Vacancies</dt>
                  <dd className="font-medium text-ink">{job.vacancies}</dd>
                </div>
              )}
              {salaryLabel && (
                <div className="flex justify-between">
                  <dt className="text-muted">Salary</dt>
                  <dd className="font-medium text-ink">{salaryLabel}</dd>
                </div>
              )}
              {job.deadline && (
                <div className="flex justify-between">
                  <dt className="text-muted">Deadline</dt>
                  <dd className="font-medium text-ink">{new Date(job.deadline).toLocaleDateString()}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Applications</dt>
                <dd className="font-medium text-ink">{job._count?.applications ?? 0}</dd>
              </div>
            </dl>
          </div>

          {/* Company card */}
          <div className="rounded-2xl border border-border bg-white p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">About the Company</h3>
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-pageBg text-muted shrink-0">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{job.company.name}</p>
                {job.company.industry && <p className="text-xs text-muted">{job.company.industry}</p>}
              </div>
            </div>
            {job.company.description && (
              <p className="text-xs text-muted line-clamp-3">{job.company.description}</p>
            )}
            {job.company.website && (
              <a href={job.company.website} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-1.5 text-xs text-brandGreen hover:underline">
                <Globe className="h-3.5 w-3.5" /> Visit website
              </a>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
