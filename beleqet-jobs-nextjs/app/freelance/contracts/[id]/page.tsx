'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useGetContractQuery, useApproveMilestoneMutation } from '@/lib/store/slices/freelanceApiSlice';
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
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-pageBg p-6">
            <p className="text-sm text-muted">Contract status</p>
            <p className="mt-2 text-xl font-semibold text-ink">{contract.status.replace('_', ' ')}</p>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6">
            <p className="text-sm text-muted">Started on</p>
            <p className="mt-2 text-sm font-semibold text-ink">{new Date(contract.startedAt).toLocaleDateString()}</p>
          </div>
        </aside>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-white p-8">
        <h2 className="text-lg font-semibold text-ink mb-4">Milestones</h2>
        {contract.milestones?.length ? (
          <div className="space-y-4">
            {contract.milestones.map((milestone) => (
              <div key={milestone.id} className="rounded-2xl border border-border bg-pageBg p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">{milestone.title || `Milestone ${milestone.id.slice(0, 6)}`}</p>
                    <p className="text-sm text-muted">{milestone.description || 'No description provided.'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">{milestone.amount?.toLocaleString()} ETB</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">{milestone.status}</p>
                  </div>
                </div>
                {isClient && milestone.status === 'PENDING' && (
                  <button
                    type="button"
                    disabled={isApproving}
                    onClick={() => handleApprove(milestone.id)}
                    className="mt-4 inline-flex rounded-lg bg-brandGreen px-4 py-2 text-sm font-semibold text-white hover:bg-darkGreen disabled:opacity-60"
                  >
                    {isApproving ? 'Approving…' : 'Approve milestone'}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No milestones available for this contract.</p>
        )}
      </div>
    </div>
  );
}
