import React from 'react';
import { Contract, ContractStatus } from '../lib/store/slices/freelanceApiSlice';
import { StatusBadge, StatusType } from './StatusBadge';

interface ContractCardProps {
  contract: Contract;
  onViewDetails?: (contractId: string) => void;
}

export function ContractCard({ contract, onViewDetails }: ContractCardProps) {
  const milestones = contract.milestones || [];
  const progress = milestones.length > 0
    ? (milestones.filter(m => m.status === 'APPROVED').length / milestones.length) * 100
    : 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {contract.freelanceJob?.title || 'Contract'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {contract.client.firstName} {contract.client.lastName} ↔ {contract.freelancer.firstName} {contract.freelancer.lastName}
          </p>
        </div>
        <StatusBadge status={contract.status as StatusType} />
      </div>

      {/* Amount */}
      <div className="mb-4">
        <p className="text-2xl font-bold text-gray-900">
          {contract.currency === 'ETB' ? 'ETB' : '$'} {contract.agreedAmount.toLocaleString()}
        </p>
        <p className="text-sm text-gray-500">Agreed amount</p>
      </div>

      {/* Progress */}
      {milestones.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {milestones.filter(m => m.status === 'APPROVED').length} of {milestones.length} milestones completed
          </p>
        </div>
      )}

      {/* Dates */}
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <div>
          <span className="block text-gray-500 text-xs">Started</span>
          {formatDate(contract.startedAt)}
        </div>
        {contract.completedAt && (
          <div>
            <span className="block text-gray-500 text-xs">Completed</span>
            {formatDate(contract.completedAt)}
          </div>
        )}
      </div>

      {/* Dispute warning */}
      {contract.dispute && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800">Dispute Active</p>
          <p className="text-xs text-red-600 mt-1">{contract.dispute.reason}</p>
        </div>
      )}

      {/* Action button */}
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(contract.id)}
          className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          View Details
        </button>
      )}
    </div>
  );
}
