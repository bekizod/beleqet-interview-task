'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useGetContractQuery, useApproveMilestoneMutation } from '@/lib/store/slices/freelanceApiSlice';
import { StatusBadge } from '@/components/StatusBadge';
import { MilestoneList } from '@/components/MilestoneList';
import toast from 'react-hot-toast';

interface FreelanceContractPageProps {
  params: { id: string };
}

export default function FreelanceContractPage({ params }: FreelanceContractPageProps) {
  const { id } = params;
  const { user } = useAuth();
  const { data: contract, isLoading, isError } = useGetContractQuery(id);
  const [approveMilestone, { isLoading: isApproving }] = useApproveMilestoneMutation();

  const handleApprove = async (milestoneId: string) => {
    try {
      await approveMilestone(milestoneId).unwrap();
      toast.success('Milestone approved successfully.');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Unable to approve milestone.');
    }
  };

  if (isLoading) {
    return (
      <div className="container-page py-10">
        <div className="rounded-2xl border border-border bg-white p-8 text-center text-muted">Loading contract...</div>
      </div>
    );
  }

  if (isError || !contract) {
    return (
      <div className="container-page py-10">
        <div className="rounded-2xl border border-border bg-white p-8 text-center text-muted">Unable to load contract details.</div>
      </div>
    );
  }

  const isClient = user?.id === contract.clientId;
  const milestones = contract.milestones || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const progress = milestones.length > 0
    ? (milestones.filter(m => m.status === 'APPROVED').length / milestones.length) * 100
    : 0;

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-pageH1">Contract details</h1>
        <p className="text-muted text-sm mt-2">Review the active contract and approve milestones when they are ready.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
        <section className="rounded-2xl border border-border bg-white p-8 space-y-6">
          <div>
            <p className="text-sm text-muted">Contract ID</p>
            <p className="mt-2 text-base font-semibold text-ink">{contract.id}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-pageBg p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Freelance job</p>
              <p className="mt-2 text-sm font-semibold text-ink">{contract.freelanceJob?.title ?? 'N/A'}</p>
            </div>
            <div className="rounded-2xl border border-border bg-pageBg p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Agreed amount</p>
              <p className="mt-2 text-sm font-semibold text-ink">{contract.agreedAmount?.toLocaleString()} ETB</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-pageBg p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Client</p>
              <p className="mt-2 text-sm font-semibold text-ink">{contract.client.firstName} {contract.client.lastName}</p>
            </div>
            <div className="rounded-2xl border border-border bg-pageBg p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Freelancer</p>
              <p className="mt-2 text-sm font-semibold text-ink">{contract.freelancer.firstName} {contract.freelancer.lastName}</p>
            </div>
          </div>

          {/* Progress bar */}
          {milestones.length > 0 && (
            <div className="rounded-2xl border border-border bg-pageBg p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted">Overall Progress</span>
                <span className="font-semibold text-ink">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted mt-1">
                {milestones.filter(m => m.status === 'APPROVED').length} of {milestones.length} milestones completed
              </p>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-pageBg p-6">
            <p className="text-sm text-muted">Contract status</p>
            <div className="mt-2">
              <StatusBadge status={contract.status as any} size="md" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6">
            <p className="text-sm text-muted">Started on</p>
            <p className="mt-2 text-sm font-semibold text-ink">{formatDate(contract.startedAt)}</p>
          </div>

          {contract.completedAt && (
            <div className="rounded-2xl border border-border bg-white p-6">
              <p className="text-sm text-muted">Completed on</p>
              <p className="mt-2 text-sm font-semibold text-ink">{formatDate(contract.completedAt)}</p>
            </div>
          )}

          {contract.dispute && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm font-semibold text-red-800">Dispute Active</p>
              <p className="mt-2 text-sm text-red-600">{contract.dispute.reason}</p>
              {contract.dispute.resolution && (
                <p className="mt-2 text-sm text-red-700">Resolution: {contract.dispute.resolution}</p>
              )}
            </div>
          )}
        </aside>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-white p-8">
        <h2 className="text-lg font-semibold text-ink mb-4">Milestones</h2>
        <MilestoneList
          milestones={milestones}
          onApprove={isClient ? handleApprove : undefined}
          canApprove={isClient}
        />
      </div>
    </div>
  );
}
