'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGetMyContractsQuery } from '@/lib/store/slices/freelanceApiSlice';
import { ContractList } from '@/components/ContractList';

export default function ContractsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { data: contracts = [], isLoading, isError } = useGetMyContractsQuery(undefined, {
    skip: !isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleViewDetails = (contractId: string) => {
    router.push(`/freelance/contracts/${contractId}`);
  };

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="container-page py-10">
        <div className="mb-6">
          <h1 className="text-pageH1">My Contracts</h1>
          <p className="text-muted text-sm mt-2">Manage your freelance contracts and milestones</p>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-white p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container-page py-10">
        <div className="mb-6">
          <h1 className="text-pageH1">My Contracts</h1>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm text-red-600">Failed to load contracts. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Split into client contracts and freelancer contracts for better UX
  const asClient = contracts.filter((c) => c.clientId === user?.id);
  const asFreelancer = contracts.filter((c) => c.freelancerId === user?.id);

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-pageH1">My Contracts</h1>
          <p className="text-muted text-sm mt-2">Manage your freelance contracts and milestones</p>
        </div>
        <Link
          href="/freelance"
          className="text-sm font-semibold text-brandGreen hover:underline shrink-0"
        >
          Browse gigs →
        </Link>
      </div>

      {contracts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center">
          <p className="text-muted text-sm">No contracts yet.</p>
          <p className="text-muted text-xs mt-1">
            Contracts are created when a client accepts a bid on a freelance gig.
          </p>
          <Link
            href="/freelance"
            className="mt-6 inline-block rounded-lg bg-brandGreen px-5 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen"
          >
            Browse gigs
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {asClient.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-ink mb-4">
                As client
                <span className="ml-2 text-xs font-normal text-muted">({asClient.length})</span>
              </h2>
              <ContractList
                contracts={asClient}
                onViewDetails={handleViewDetails}
                emptyMessage="No contracts as a client."
              />
            </div>
          )}

          {asFreelancer.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-ink mb-4">
                As freelancer
                <span className="ml-2 text-xs font-normal text-muted">({asFreelancer.length})</span>
              </h2>
              <ContractList
                contracts={asFreelancer}
                onViewDetails={handleViewDetails}
                emptyMessage="No contracts as a freelancer."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
