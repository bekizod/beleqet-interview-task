'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useGetMyJobsQuery, useDeleteJobMutation } from '@/lib/store/slices/jobsApiSlice';
import { useRouter } from 'next/navigation';
import { Briefcase, MapPin, Calendar, Users, Trash2, Edit, Eye, Building2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyJobsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { data: jobs, isLoading } = useGetMyJobsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [deleteJob] = useDeleteJobMutation();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await deleteJob(id).unwrap();
      toast.success('Job deleted successfully');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete job');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'DRAFT':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      case 'CLOSED':
        return { color: 'bg-red-100 text-red-800', icon: XCircle };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
    }
  };

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'FULL_TIME':
        return 'bg-purple-100 text-purple-800';
      case 'PART_TIME':
        return 'bg-blue-100 text-blue-800';
      case 'CONTRACT':
        return 'bg-orange-100 text-orange-800';
      case 'INTERNSHIP':
        return 'bg-pink-100 text-pink-800';
      case 'REMOTE':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white p-8 rounded-lg shadow-sm max-w-md">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Access Restricted</h2>
            <p className="mt-2 text-gray-600">Please log in to view your job postings</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Job Postings</h1>
              <p className="text-gray-600 mt-1">
                {jobs && jobs.length > 0 
                  ? `You have ${jobs.length} active job posting${jobs.length > 1 ? 's' : ''}`
                  : 'Start posting jobs to find the perfect candidates'}
              </p>
            </div>
            <button
              onClick={() => router.push('/post-job')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Post New Job
            </button>
          </div>
        </div>

        {jobs && jobs.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applications
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posted Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map((job) => {
                    const StatusIcon = getStatusConfig(job.status).icon;
                    return (
                      <tr key={job.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{job.title}</div>
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                              <Building2 className="h-3.5 w-3.5 mr-1" />
                              {job?.company?.name}
                              <span className="mx-2">•</span>
                              <MapPin className="h-3.5 w-3.5 mr-1" />
                              {job.location}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getJobTypeColor(job.type)}`}>
                            {job.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-900">
                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="font-medium">{job._count.applications}</span>
                            <span className="ml-1 text-gray-500">applicant{job._count.applications !== 1 ? 's' : ''}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusConfig(job.status).color}`}>
                            <StatusIcon className="h-3 w-3 mr-1.5" />
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {new Date(job.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => router.push(`/my-jobs/${job.id}`)}
                              className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors duration-200"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/my-jobs/${job.id}/applications`)}
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              title="View Applications"
                            >
                              <Users className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(job.id)}
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Delete Job"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden divide-y divide-gray-200">
              {jobs.map((job) => {
                const StatusIcon = getStatusConfig(job.status).icon;
                return (
                  <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <Building2 className="h-3.5 w-3.5 mr-1" />
                          {job?.company?.name}
                        </div>
                      </div>
                      <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusConfig(job.status).color}`}>
                        <StatusIcon className="h-3 w-3 mr-1.5" />
                        {job.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {job.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getJobTypeColor(job.type)}`}>
                          {job.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        {job._count.applications} applicants
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {new Date(job.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/my-jobs/${job.id}`)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/my-jobs/${job.id}/applications`)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Applicants
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-50 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs posted yet</h3>
              <p className="text-gray-600 mb-6">Get started by posting your first job and find the perfect candidates for your team.</p>
              <button
                onClick={() => router.push('/post-job')}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Post Your First Job
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}