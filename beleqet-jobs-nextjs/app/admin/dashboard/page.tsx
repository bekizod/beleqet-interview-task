'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetUsersQuery, useSuspendUserMutation, useGetDisputesQuery, useResolveDisputeMutation } from '@/lib/store/slices/adminApiSlice';
import { useLogoutMutation } from '@/lib/store/slices/authApiSlice';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: users, isLoading: loadingUsers, refetch: refetchUsers } = useGetUsersQuery();
  const { data: disputes, isLoading: loadingDisputes, refetch: refetchDisputes } = useGetDisputesQuery();
  const [suspendUser] = useSuspendUserMutation();
  const [resolveDispute] = useResolveDisputeMutation();
  const [logout] = useLogoutMutation();
  
  const [activeTab, setActiveTab] = useState<'users' | 'disputes'>('users');
  const [resolutionText, setResolutionText] = useState('');
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);

  const handleSuspendUser = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;
    
    try {
      await suspendUser(userId).unwrap();
      toast.success('User suspended successfully');
      refetchUsers();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to suspend user');
    }
  };

  const handleResolveDispute = async () => {
    if (!selectedDisputeId || !resolutionText.trim()) {
      toast.error('Please provide a resolution');
      return;
    }
    
    try {
      await resolveDispute({ id: selectedDisputeId, dto: { resolution: resolutionText } }).unwrap();
      toast.success('Dispute resolved successfully');
      setResolutionText('');
      setSelectedDisputeId(null);
      refetchDisputes();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to resolve dispute');
    }
  };

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      router.push('/admin/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`${
                    activeTab === 'users'
                      ? 'border-green-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('disputes')}
                  className={`${
                    activeTab === 'disputes'
                      ? 'border-green-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Disputes
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'users' && (
          <div className="px-4 py-6 sm:px-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">User Management</h2>
            {loadingUsers ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading users...</p>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {users?.map((user) => (
                    <li key={user.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-green-600 truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="mt-1 flex items-center text-sm text-gray-500">
                            <span className="truncate">{user.email}</span>
                            <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {user.role}
                            </span>
                            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Suspended'}
                            </span>
                          </p>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex space-x-2">
                          {user.isActive && user.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleSuspendUser(user.id)}
                              className="px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'disputes' && (
          <div className="px-4 py-6 sm:px-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dispute Management</h2>
            {loadingDisputes ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading disputes...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {disputes?.map((dispute) => (
                  <div key={dispute.id} className="bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Dispute #{dispute.id.slice(0, 8)}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Contract: {dispute.contract.freelanceJob.title}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            Client: {dispute.contract.client.firstName} {dispute.contract.client.lastName} ({dispute.contract.client.email})
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            Freelancer: {dispute.contract.freelancer.firstName} {dispute.contract.freelancer.lastName} ({dispute.contract.freelancer.email})
                          </p>
                          <p className="mt-2 text-sm text-gray-700">
                            <span className="font-medium">Reason:</span> {dispute.reason}
                          </p>
                          {dispute.resolution && (
                            <p className="mt-2 text-sm text-green-700">
                              <span className="font-medium">Resolution:</span> {dispute.resolution}
                            </p>
                          )}
                          {dispute.resolvedAt && (
                            <p className="mt-1 text-xs text-gray-500">
                              Resolved on: {new Date(dispute.resolvedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      {!dispute.resolution && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Resolution
                          </label>
                          <textarea
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            placeholder="Enter resolution details..."
                            value={selectedDisputeId === dispute.id ? resolutionText : ''}
                            onChange={(e) => {
                              setSelectedDisputeId(dispute.id);
                              setResolutionText(e.target.value);
                            }}
                          />
                          <button
                            onClick={handleResolveDispute}
                            disabled={!resolutionText.trim()}
                            className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Resolve Dispute
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {disputes?.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No disputes found
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
