import React from 'react';
import { Milestone, MilestoneStatus } from '../lib/store/slices/freelanceApiSlice';
import { StatusBadge, StatusType } from './StatusBadge';

interface MilestoneListProps {
  milestones: Milestone[];
  onApprove?: (milestoneId: string) => void;
  onSubmit?: (milestoneId: string) => void;
  canApprove?: boolean;
  canSubmit?: boolean;
}

export function MilestoneList({ 
  milestones, 
  onApprove, 
  onSubmit,
  canApprove = false,
  canSubmit = false 
}: MilestoneListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  const sortedMilestones = [...milestones].sort((a, b) => 
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  if (sortedMilestones.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No milestones defined yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedMilestones.map((milestone, index) => (
        <div
          key={milestone.id}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                {index + 1}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                {milestone.description && (
                  <p className="text-sm text-gray-600 mt-0.5">{milestone.description}</p>
                )}
              </div>
            </div>
            <StatusBadge status={milestone.status as StatusType} size="sm" />
          </div>

          {/* Amount and deadline */}
          <div className="flex items-center gap-6 text-sm mb-3">
            <div>
              <span className="text-gray-500">Amount:</span>
              <span className="ml-1 font-medium text-gray-900">
                {milestone.amount.toLocaleString()} ETB
              </span>
            </div>
            <div>
              <span className="text-gray-500">Deadline:</span>
              <span className={`ml-1 font-medium ${isOverdue(milestone.deadline) && milestone.status !== 'APPROVED' ? 'text-red-600' : 'text-gray-900'}`}>
                {formatDate(milestone.deadline)}
                {isOverdue(milestone.deadline) && milestone.status !== 'APPROVED' && ' (Overdue)'}
              </span>
            </div>
          </div>

          {/* Deliverables */}
          {milestone.deliverables && milestone.deliverables.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Deliverables:</p>
              <div className="space-y-1">
                {milestone.deliverables.map((deliverable) => (
                  <div key={deliverable.id} className="flex items-center gap-2 text-sm">
                    {deliverable.fileUrl ? (
                      <a
                        href={deliverable.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View File
                      </a>
                    ) : (
                      <span className="text-gray-500">No file attached</span>
                    )}
                    {deliverable.notes && (
                      <span className="text-gray-600">- {deliverable.notes}</span>
                    )}
                    <span className="text-xs text-gray-400">
                      ({formatDate(deliverable.submittedAt)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            {canSubmit && milestone.status === 'IN_PROGRESS' && onSubmit && (
              <button
                onClick={() => onSubmit(milestone.id)}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Submit Deliverable
              </button>
            )}
            {canApprove && milestone.status === 'SUBMITTED' && onApprove && (
              <button
                onClick={() => onApprove(milestone.id)}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                Approve Milestone
              </button>
            )}
            {milestone.approvedAt && (
              <span className="text-xs text-gray-500 ml-auto">
                Approved on {formatDate(milestone.approvedAt)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
