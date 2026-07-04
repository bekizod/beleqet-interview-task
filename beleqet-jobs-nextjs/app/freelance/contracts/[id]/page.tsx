'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  useGetContractQuery,
  useApproveMilestoneMutation,
  useStartMilestoneMutation,
  useSubmitMilestoneMutation,
  useRequestRevisionMutation,
  useCreateMilestoneMutation,
  useCreateDisputeMutation,
  useReleaseMilestoneMutation,
  type Milestone,
} from '@/lib/store/slices/freelanceApiSlice';
import { StatusBadge } from '@/components/StatusBadge';

interface Props { params: { id: string } }

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function isOverdue(d: string) { return new Date(d) < new Date(); }

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  SUBMITTED: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REVISION_REQUESTED: 'bg-orange-100 text-orange-700',
};

// ── Add Milestone Form ──────────────────────────────────────────────────────
function AddMilestoneForm({ contractId, onClose }: { contractId: string; onClose: () => void }) {
  const [createMilestone, { isLoading }] = useCreateMilestoneMutation();
  const [form, setForm] = useState({ title: '', description: '', amount: '', deadline: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.deadline) {
      toast.error('Title, amount and deadline are required.');
      return;
    }
    try {
      await createMilestone({
        contractId,
        dto: {
          title: form.title,
          description: form.description || undefined,
          amount: Number(form.amount),
          deadline: form.deadline,
        },
      }).unwrap();
      toast.success('Milestone added.');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to add milestone.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md">
        <h3 className="text-lg font-semibold text-ink mb-6">Add milestone</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm text-muted">
            Title *
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-ink focus:outline-none focus:border-brandGreen"
              placeholder="e.g. Design mockups" required />
          </label>
          <label className="block text-sm text-muted">
            Description
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-ink focus:outline-none focus:border-brandGreen"
              rows={3} placeholder="Describe what needs to be delivered" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm text-muted">
              Amount (ETB) *
              <input type="number" min={1} value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-ink focus:outline-none focus:border-brandGreen"
                placeholder="5000" required />
            </label>
            <label className="block text-sm text-muted">
              Deadline *
              <input type="date" value={form.deadline}
                onChange={e => setForm({ ...form, deadline: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-ink focus:outline-none focus:border-brandGreen"
                required />
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-pageBg">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 rounded-lg bg-brandGreen px-4 py-2 text-sm font-semibold text-white hover:bg-darkGreen disabled:opacity-50">
              {isLoading ? 'Adding…' : 'Add milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Submit Deliverable Modal ────────────────────────────────────────────────
function SubmitDeliverableModal({ milestoneId, onClose }: { milestoneId: string; onClose: () => void }) {
  const [submitMilestone, { isLoading }] = useSubmitMilestoneMutation();
  const [form, setForm] = useState({ fileUrl: '', notes: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitMilestone({
        id: milestoneId,
        dto: { fileUrl: form.fileUrl || undefined, notes: form.notes || undefined },
      }).unwrap();
      toast.success('Deliverable submitted. Awaiting client review.');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to submit deliverable.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md">
        <h3 className="text-lg font-semibold text-ink mb-6">Submit deliverable</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm text-muted">
            File URL (optional)
            <input value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-ink focus:outline-none focus:border-brandGreen"
              placeholder="https://drive.google.com/..." />
          </label>
          <label className="block text-sm text-muted">
            Notes
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-ink focus:outline-none focus:border-brandGreen"
              rows={4} placeholder="Describe what you have delivered" />
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-pageBg">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 rounded-lg bg-brandGreen px-4 py-2 text-sm font-semibold text-white hover:bg-darkGreen disabled:opacity-50">
              {isLoading ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Single Milestone Card ───────────────────────────────────────────────────
function MilestoneCard({
  milestone,
  index,
  isClient,
  isFreelancer,
}: {
  milestone: Milestone;
  index: number;
  isClient: boolean;
  isFreelancer: boolean;
}) {
  const [approveMilestone, { isLoading: isApproving }] = useApproveMilestoneMutation();
  const [startMilestone, { isLoading: isStarting }] = useStartMilestoneMutation();
  const [requestRevision, { isLoading: isRequesting }] = useRequestRevisionMutation();
  const [showSubmit, setShowSubmit] = useState(false);

  const handleApprove = async () => {
    try {
      await approveMilestone(milestone.id).unwrap();
      toast.success('Milestone approved.');
    } catch (err: any) { toast.error(err?.data?.message || 'Failed to approve.'); }
  };

  const handleStart = async () => {
    try {
      await startMilestone(milestone.id).unwrap();
      toast.success('Milestone started.');
    } catch (err: any) { toast.error(err?.data?.message || 'Failed to start.'); }
  };

  const handleRevision = async () => {
    try {
      await requestRevision(milestone.id).unwrap();
      toast.success('Revision requested.');
    } catch (err: any) { toast.error(err?.data?.message || 'Failed to request revision.'); }
  };

  const overdue = isOverdue(milestone.deadline) && milestone.status !== 'APPROVED';

  return (
    <>
      {showSubmit && (
        <SubmitDeliverableModal milestoneId={milestone.id} onClose={() => setShowSubmit(false)} />
      )}
      <div className="rounded-xl border border-border bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pageBg text-xs font-semibold text-ink">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{milestone.title}</p>
              {milestone.description && (
                <p className="mt-0.5 text-xs text-muted">{milestone.description}</p>
              )}
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColors[milestone.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {milestone.status.replace('_', ' ')}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-muted">Amount</span>
            <p className="font-semibold text-ink">{milestone.amount.toLocaleString()} ETB</p>
          </div>
          <div>
            <span className="text-muted">Deadline</span>
            <p className={`font-semibold ${overdue ? 'text-red-600' : 'text-ink'}`}>
              {fmt(milestone.deadline)}{overdue ? ' — Overdue' : ''}
            </p>
          </div>
          {milestone.approvedAt && (
            <div>
              <span className="text-muted">Approved</span>
              <p className="font-semibold text-green-700">{fmt(milestone.approvedAt)}</p>
            </div>
          )}
        </div>

        {/* Deliverables */}
        {milestone.deliverables && milestone.deliverables.length > 0 && (
          <div className="mt-4 rounded-lg bg-pageBg p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Deliverables</p>
            {milestone.deliverables.map(d => (
              <div key={d.id} className="flex items-center gap-2 text-sm">
                {d.fileUrl ? (
                  <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="text-brandGreen hover:underline">View file ↗</a>
                ) : <span className="text-muted">No file</span>}
                {d.notes && <span className="text-muted">— {d.notes}</span>}
                <span className="ml-auto text-xs text-muted">{fmt(d.submittedAt)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions row */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          {/* Freelancer actions */}
          {isFreelancer && milestone.status === 'PENDING' && (
            <button onClick={handleStart} disabled={isStarting}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {isStarting ? 'Starting…' : 'Start milestone'}
            </button>
          )}
          {isFreelancer && (milestone.status === 'IN_PROGRESS' || milestone.status === 'REVISION_REQUESTED') && (
            <button onClick={() => setShowSubmit(true)}
              className="rounded-lg bg-brandGreen px-3 py-1.5 text-xs font-semibold text-white hover:bg-darkGreen">
              Submit deliverable
            </button>
          )}
          {/* Client actions */}
          {isClient && milestone.status === 'SUBMITTED' && (
            <>
              <button onClick={handleApprove} disabled={isApproving}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                {isApproving ? 'Approving…' : 'Approve'}
              </button>
              <button onClick={handleRevision} disabled={isRequesting}
                className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-50">
                {isRequesting ? 'Requesting…' : 'Request revision'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function FreelanceContractPage({ params }: Props) {
  const { id } = params;
  const { user } = useAuth();
  const { data: contract, isLoading, isError } = useGetContractQuery(id);
  const [releaseMilestone, { isLoading: isReleasing }] = useReleaseMilestoneMutation();
  const [createDispute, { isLoading: isCreatingDispute }] = useCreateDisputeMutation();
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  if (isLoading) return (
    <div className="container-page py-10">
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );

  if (isError || !contract) return (
    <div className="container-page py-10">
      <div className="rounded-2xl border border-border bg-white p-8 text-center text-muted">
        Unable to load contract details.
      </div>
    </div>
  );

  const isClient = user?.id === contract.clientId;
  const isFreelancer = user?.id === contract.freelancerId;

  if (!isClient && !isFreelancer) return (
    <div className="container-page py-10">
      <div className="rounded-2xl border border-border bg-white p-8 text-center text-muted">
        You do not have permission to view this contract.
      </div>
    </div>
  );

  const milestones = contract.milestones ?? [];
  const approved = milestones.filter(m => m.status === 'APPROVED').length;
  const progress = milestones.length > 0 ? Math.round((approved / milestones.length) * 100) : 0;

  const handleCreateDispute = async () => {
    if (!disputeReason.trim()) { toast.error('Please provide a reason.'); return; }
    try {
      await createDispute({ contractId: id, reason: disputeReason, evidenceUrls: [] }).unwrap();
      toast.success('Dispute raised.');
      setShowDisputeModal(false);
      setDisputeReason('');
    } catch (err: any) { toast.error(err?.data?.message || 'Failed to raise dispute.'); }
  };

  return (
    <div className="container-page py-10">
      {showAddMilestone && (
        <AddMilestoneForm contractId={id} onClose={() => setShowAddMilestone(false)} />
      )}

      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <Link href="/freelance/contracts" className="text-xs text-muted hover:text-ink">← My contracts</Link>
          <h1 className="mt-2 text-pageH1">Contract details</h1>
          <p className="text-muted text-sm mt-1">
            {contract.freelanceJob?.title ?? 'Freelance contract'}
          </p>
        </div>
        <StatusBadge status={contract.status as any} size="md" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
        {/* Left — contract info */}
        <section className="space-y-6">
          <div className="rounded-2xl border border-border bg-white p-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">Client</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {contract.client.firstName} {contract.client.lastName}
                {isClient && <span className="ml-1 text-xs text-brandGreen">(you)</span>}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">Freelancer</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {contract.freelancer.firstName} {contract.freelancer.lastName}
                {isFreelancer && <span className="ml-1 text-xs text-brandGreen">(you)</span>}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">Agreed amount</p>
              <p className="mt-1 text-sm font-semibold text-ink">{contract.agreedAmount.toLocaleString()} ETB</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">Started</p>
              <p className="mt-1 text-sm font-semibold text-ink">{fmt(contract.startedAt)}</p>
            </div>
            {contract.completedAt && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">Completed</p>
                <p className="mt-1 text-sm font-semibold text-green-700">{fmt(contract.completedAt)}</p>
              </div>
            )}
          </div>

          {/* Escrow card */}
          {contract.freelanceJob?.escrowTx && (
            <div className="rounded-2xl border border-border bg-white p-6">
              <p className="text-xs uppercase tracking-wider text-muted mb-3">Escrow</p>
              <div className="flex items-center gap-3 mb-4">
                <StatusBadge status={contract.freelanceJob.escrowTx.status as any} size="sm" />
              </div>
              <div className="space-y-2 text-sm">
                {[
                  ['Gross amount', `${contract.freelanceJob.escrowTx.grossAmount.toLocaleString()} ETB`],
                  ['Platform fee (10%)', `${contract.freelanceJob.escrowTx.platformFee.toLocaleString()} ETB`],
                  ['Net to freelancer', `${contract.freelanceJob.escrowTx.netAmount.toLocaleString()} ETB`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted">{label}</span>
                    <span className="font-semibold text-ink">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dispute */}
          {contract.dispute ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm font-semibold text-red-800">Dispute active</p>
              <p className="mt-1 text-sm text-red-600">{contract.dispute.reason}</p>
              {contract.dispute.resolution && (
                <p className="mt-2 text-sm font-medium text-red-700">
                  Resolution: {contract.dispute.resolution}
                </p>
              )}
            </div>
          ) : contract.status === 'ACTIVE' && (
            <button onClick={() => setShowDisputeModal(true)}
              className="w-full rounded-2xl border border-red-200 bg-red-50 p-5 text-left hover:bg-red-100 transition-colors">
              <p className="text-sm font-semibold text-red-800">Raise a dispute</p>
              <p className="mt-1 text-xs text-red-500">Report an issue with this contract</p>
            </button>
          )}
        </section>

        {/* Right — milestones */}
        <aside className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">
              Milestones
              <span className="ml-2 text-xs font-normal text-muted">({milestones.length})</span>
            </h2>
            {isClient && contract.status === 'ACTIVE' && (
              <button onClick={() => setShowAddMilestone(true)}
                className="rounded-lg bg-brandGreen px-3 py-1.5 text-xs font-semibold text-white hover:bg-darkGreen">
                + Add milestone
              </button>
            )}
          </div>

          {/* Progress bar */}
          {milestones.length > 0 && (
            <div className="rounded-xl border border-border bg-white p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Progress</span>
                <span className="font-semibold text-ink">{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-brandGreen transition-all duration-300"
                  style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted">{approved} of {milestones.length} approved</p>
            </div>
          )}

          {milestones.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-pageBg p-8 text-center">
              <p className="text-sm text-muted">No milestones yet.</p>
              {isClient && contract.status === 'ACTIVE' && (
                <button onClick={() => setShowAddMilestone(true)}
                  className="mt-3 text-sm font-semibold text-brandGreen hover:underline">
                  Add the first milestone
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {[...milestones]
                .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                .map((m, i) => (
                  <MilestoneCard
                    key={m.id}
                    milestone={m}
                    index={i}
                    isClient={isClient}
                    isFreelancer={isFreelancer}
                  />
                ))}
            </div>
          )}
        </aside>
      </div>

      {/* Dispute modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h3 className="text-lg font-semibold text-ink mb-4">Raise a dispute</h3>
            <textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)}
              className="w-full rounded-lg border border-border p-3 text-sm text-ink focus:outline-none focus:border-brandGreen min-h-[120px]"
              placeholder="Describe the issue in detail…" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowDisputeModal(false); setDisputeReason(''); }}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-pageBg">
                Cancel
              </button>
              <button onClick={handleCreateDispute} disabled={isCreatingDispute}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {isCreatingDispute ? 'Submitting…' : 'Submit dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
