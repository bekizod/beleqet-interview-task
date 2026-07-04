'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetUsersQuery, useSuspendUserMutation,
  useGetDisputesQuery, useResolveDisputeMutation,
  useGetAdminJobsQuery, useFeatureJobMutation,
} from '@/lib/store/slices/adminApiSlice';
import { useLogoutMutation } from '@/lib/store/slices/authApiSlice';
import { Star, Building2, MapPin, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: users, isLoading: loadingUsers, refetch: refetchUsers } = useGetUsersQuery();
  const { data: disputes, isLoading: loadingDisputes, refetch: refetchDisputes } = useGetDisputesQuery();
  const { data: jobs, isLoading: loadingJobs } = useGetAdminJobsQuery();
  const [suspendUser] = useSuspendUserMutation();
  const [resolveDispute] = useResolveDisputeMutation();
  const [featureJob] = useFeatureJobMutation();
  const [logout] = useLogoutMutation();

  const [activeTab, setActiveTab] = useState<'users' | 'disputes' | 'jobs'>('users');
  const [resolutionText, setResolutionText] = useState('');
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [jobSearch, setJobSearch] = useState('');

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

  const handleToggleFeature = async (id: string, currentFeatured: boolean) => {
    try {
      const result = await featureJob({ id, featured: !currentFeatured }).unwrap();
      toast.success(result.message);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update featured status.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      router.push('/admin/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  const filteredJobs = (jobs ?? []).filter(j =>
    !jobSearch ||
    j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
    j.company.name.toLowerCase().includes(jobSearch.toLowerCase()),
  );

  const tabs: { key: 'users' | 'disputes' | 'jobs'; label: string }[] = [
    { key: 'users', label: 'Users' },
    { key: 'disputes', label: 'Disputes' },
    { key: 'jobs', label: 'Featured Jobs' },
  ];

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
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`${
                      activeTab === tab.key
                        ? 'border-green-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {tab.label}
                  </button>
                ))}
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
        {activeTab === 'jobs' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Featured Jobs</h2>
              <span className="text-sm text-gray-500">
                {filteredJobs.filter(j => j.featured).length} featured / {filteredJobs.length} total
              </span>
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                value={jobSearch}
                onChange={e => setJobSearch(e.target.value)}
                placeholder="Search by title or company..."
                className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {loadingJobs ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" />
                <p className="mt-4 text-gray-600">Loading jobs...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-md border border-gray-200">
                No jobs found.
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Applications</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredJobs.map(job => (
                      <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{job.title}</p>
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500 sm:hidden">
                            <Building2 className="h-3 w-3" />{job.company.name}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />{job.category.label}
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <span className="text-sm text-gray-900">{job.company.name}</span>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Users className="h-3.5 w-3.5" />{job._count.applications}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            job.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                            job.status === 'DRAFT'     ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleFeature(job.id, job.featured)}
                            title={job.featured ? 'Remove from featured' : 'Mark as featured'}
                            className="inline-flex items-center justify-center rounded-lg p-1.5 hover:bg-yellow-50 transition-colors"
                          >
                            <Star className={`h-5 w-5 transition-colors ${
                              job.featured
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 hover:text-yellow-300'
                            }`} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
