import React from 'react';

export type StatusType = 
  | 'ACTIVE' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'
  | 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<StatusType, { label: string; color: string }> = {
  // Contract statuses
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800' },
  COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-800' },
  DISPUTED: { label: 'Disputed', color: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  
  // Milestone statuses
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  SUBMITTED: { label: 'Submitted', color: 'bg-purple-100 text-purple-800' },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800' },
  REVISION_REQUESTED: { label: 'Revision Requested', color: 'bg-orange-100 text-orange-800' },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.color} ${sizeClasses[size]}`}>
      {config.label}
    </span>
  );
}
