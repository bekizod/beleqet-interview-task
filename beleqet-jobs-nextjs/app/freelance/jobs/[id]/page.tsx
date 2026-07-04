'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useGetFreelanceJobQuery, useSubmitBidMutation, useAcceptBidMutation, useInitiateEscrowMutation } from '@/lib/store/slices/freelanceApiSlice';
import { useAuth } from '@/lib/hooks/useAuth';

interface FreelanceJobPageProps {
  params: { id: string };
}

export default function FreelanceJobPage({ params }: FreelanceJobPageProps) {
  const { id } = params;
  const { user, isAuthenticated } = useAuth();
  const { data: job, isLoading, isError } = useGetFreelanceJobQuery(id);
  const [submitBid, { isLoading: isSubmitting }] = useSubmitBidMutation();
  const [acceptBid, { isLoading: isAccepting }] = useAcceptBidMutation();
  const [initiateEscrow, { isLoading: isInitiating }] = useInitiateEscrowMutation();
  const [formData, setFormData] = useState({ amount: '', timelineDays: '', coverLetter: '' });

  const isClient = user?.id === job?.clientId;
  const hasSubmittedBid = job?.bids?.some((bid) => bid.freelancer.id === user?.id) ?? false;

  const handleBidSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.amount || !formData.timelineDays || !formData.coverLetter) {
      toast.error('Please complete all bid fields.');
      return;
    }

    try {
      await submitBid({
        jobId: id,
        dto: {
          amount: Number(formData.amount),
          timelineDays: Number(formData.timelineDays),
          coverLetter: formData.coverLetter,
        },
      }).unwrap();
      toast.success('Bid submitted successfully.');
      setFormData({ amount: '', timelineDays: '', coverLetter: '' });
    } catch (error: any) {
      toast.error(error?.data?.message || 'Unable to submit bid.');
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    try {
      await acceptBid(bidId).unwrap();
      toast.success('Bid accepted and contract created.');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Unable to accept bid.');
    }
  };

  const handleInitiateEscrow = async () => {
    try {
      const result = await initiateEscrow(id).unwrap();
      if (result.checkoutUrl) {
        window.open(result.checkoutUrl, '_blank');
        toast.success('Escrow initiated. Please complete payment.');
      } else {
        toast.success('Escrow initiated successfully.');
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Unable to initiate escrow.');
    }
  };

  if (isLoading) {
    return (
      <div className="container-page py-10">
        <div className="rounded-2xl border border-border bg-white p-8 text-center text-muted">Loading gig details...</div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="container-page py-10">
        <div className="rounded-2xl border border-border bg-white p-8 text-center text-muted">
          Unable to load this freelance gig.
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
        <section className="space-y-6 rounded-2xl border border-border bg-white p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brandGreen font-semibold">{job.category.label}</p>
            <h1 className="mt-3 text-3xl font-semibold text-ink">{job.title}</h1>
            <p className="mt-4 text-sm text-muted">{job.description}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-pageBg p-4">
              <p className="text-xs uppercase text-muted tracking-[0.2em]">Budget</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{job.budgetMin.toLocaleString()} - {job.budgetMax.toLocaleString()} ETB</p>
            </div>
            <div className="rounded-2xl border border-border bg-pageBg p-4">
              <p className="text-xs uppercase text-muted tracking-[0.2em]">Timeline</p>
              <p className="mt-2 text-lg font-semibold text-ink">{job.deadlineDays} days</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-pageBg p-6">
            <h2 className="text-base font-semibold text-ink">Gigs details</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted">Client</p>
                <p className="mt-1 text-sm font-semibold text-ink">{job.client.firstName} {job.client.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Status</p>
                <p className="mt-1 text-sm font-semibold text-ink">{job.status.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-pageBg p-6">
            <h2 className="text-base font-semibold text-ink mb-4">Bids</h2>
            {(!job.bids || job.bids.length === 0) ? (
              <p className="text-sm text-muted">No bids have been submitted yet.</p>
            ) : (
              <div className="space-y-4">
                {job.bids.map((bid) => (
                  <div key={bid.id} className="rounded-2xl border border-border bg-white p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-ink">{bid.freelancer.firstName} {bid.freelancer.lastName}</p>
                        <p className="text-sm text-muted">{bid.coverLetter}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-ink">{bid.amount.toLocaleString()} ETB</p>
                        <p className="text-sm text-muted">{bid.timelineDays} days</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">{bid.status}</p>
                      </div>
                    </div>
                    {isClient && bid.status === 'PENDING' && (
                      <button
                        type="button"
                        className="mt-4 inline-flex rounded-lg bg-brandGreen px-4 py-2 text-sm font-semibold text-white hover:bg-darkGreen"
                        onClick={() => handleAcceptBid(bid.id)}
                        disabled={isAccepting}
                      >
                        {isAccepting ? 'Accepting…' : 'Accept bid'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Escrow Status */}
          {job.escrowTx && (
            <div className="rounded-2xl border border-border bg-white p-6">
              <h2 className="text-base font-semibold text-ink mb-4">Escrow Status</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Status</span>
                  <span className="font-semibold text-ink">{job.escrowTx.status.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Gross Amount</span>
                  <span className="font-semibold text-ink">{job.escrowTx.grossAmount.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Platform Fee (10%)</span>
                  <span className="font-semibold text-ink">{job.escrowTx.platformFee.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Net Amount</span>
                  <span className="font-semibold text-ink">{job.escrowTx.netAmount.toLocaleString()} ETB</span>
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          {isClient && !job.escrowTx && job.status === 'OPEN' && (
            <div className="rounded-2xl border border-border bg-white p-6">
              <h2 className="text-base font-semibold text-ink mb-4">Fund Escrow</h2>
              <p className="text-sm text-muted mb-4">
                Fund the escrow to secure this gig. Funds will be held until milestones are approved.
              </p>
              <button
                onClick={handleInitiateEscrow}
                disabled={isInitiating}
                className="w-full rounded-lg bg-brandGreen px-4 py-3 text-sm font-semibold text-white hover:bg-darkGreen disabled:opacity-60"
              >
                {isInitiating ? 'Initiating...' : 'Fund Escrow'}
              </button>
            </div>
          )}

          {isAuthenticated && !isClient && !hasSubmittedBid && (
            <div className="rounded-2xl border border-border bg-white p-6">
              <h2 className="text-base font-semibold text-ink mb-4">Submit a bid</h2>
              <form className="space-y-4" onSubmit={handleBidSubmit}>
                <label className="block text-sm text-muted">
                  Bid amount (ETB)
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brandGreen focus:ring-brandGreen/20"
                    placeholder="10000"
                    min={1}
                  />
                </label>

                <label className="block text-sm text-muted">
                  Timeline (days)
                  <input
                    type="number"
                    value={formData.timelineDays}
                    onChange={(e) => setFormData({ ...formData, timelineDays: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brandGreen focus:ring-brandGreen/20"
                    placeholder="7"
                    min={1}
                  />
                </label>

                <label className="block text-sm text-muted">
                  Cover letter
                  <textarea
                    value={formData.coverLetter}
                    onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brandGreen focus:ring-brandGreen/20"
                    rows={5}
                    placeholder="Write a short pitch to the client"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-brandGreen px-4 py-3 text-sm font-semibold text-white hover:bg-darkGreen disabled:opacity-60"
                >
                  {isSubmitting ? 'Submitting bid…' : 'Submit bid'}
                </button>
              </form>
            </div>
          )}

          {isAuthenticated && hasSubmittedBid && (
            <div className="rounded-2xl border border-border bg-pageBg p-6 text-sm text-muted">
              You have already submitted a bid for this freelance gig.
            </div>
          )}

          {!isAuthenticated && (
            <div className="rounded-2xl border border-border bg-pageBg p-6 text-sm text-muted">
              Please log in to submit a bid.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
