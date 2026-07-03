'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGetJobApplicationsQuery, useUpdateApplicationStatusMutation } from '@/lib/store/slices/applicationsApiSlice';
import { useGetJobQuery } from '@/lib/store/slices/jobsApiSlice';
import { ArrowLeft, User, Mail, Phone, FileText, Star, CheckCircle, XCircle, Clock, Calendar, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useChatWindow } from '@/lib/hooks/useChatWindow';
import ChatWindow from '@/components/ChatWindow';

export default function JobApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const jobId = params.id as string;
  const { chatState, openChat, closeChat } = useChatWindow();
  
  const { data: job } = useGetJobQuery(jobId);
  const { data: applications, isLoading } = useGetJobApplicationsQuery(jobId, {
    skip: !isAuthenticated,
  });
  const [updateStatus] = useUpdateApplicationStatusMutation();

  const handleStatusUpdate = async (applicationId: string, status: string) => {
    try {
      await updateStatus({ id: applicationId, status: status as any }).unwrap();
      toast.success('Application status updated successfully');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'SCREENING':
        return 'bg-blue-100 text-blue-800';
      case 'SHORTLISTED':
        return 'bg-green-100 text-green-800';
      case 'INTERVIEW_SCHEDULED':
        return 'bg-purple-100 text-purple-800';
      case 'OFFERED':
        return 'bg-green-200 text-green-900';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'WITHDRAWN':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please log in to view applications</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/my-jobs')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Jobs
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Applications for {job?.title}
          </h1>
          <p className="text-gray-600 mt-2">
            {applications?.length || 0} applicant{applications?.length !== 1 ? 's' : ''}
          </p>
        </div>

        {applications && applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-lg font-bold text-green-600">
                          {application.user.firstName[0]}{application.user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.user.firstName} {application.user.lastName}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1 text-gray-400" />
                            {application.user.email}
                          </div>
                          {application.user.phone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1 text-gray-400" />
                              {application.user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                        {application.status.replace('_', ' ')}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        Applied on {new Date(application.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {application.coverLetter && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          Cover Letter
                        </h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                          {application.coverLetter}
                        </p>
                      </div>
                    )}

                    {application.score && (
                      <div className="mb-4 p-4 bg-blue-50 rounded-md">
                        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                          <Star className="h-4 w-4 mr-1" />
                          AI Screening Score
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-blue-700">Overall:</span>{' '}
                            <span className="font-semibold">{application.score.overallScore.toFixed(1)}</span>
                          </div>
                          <div>
                            <span className="text-blue-700">Skills:</span>{' '}
                            <span className="font-semibold">{application.score.skillScore.toFixed(1)}</span>
                          </div>
                          <div>
                            <span className="text-blue-700">Experience:</span>{' '}
                            <span className="font-semibold">{application.score.experienceScore.toFixed(1)}</span>
                          </div>
                        </div>
                        {application.score.reasoning && (
                          <p className="mt-2 text-xs text-blue-800">{application.score.reasoning}</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center space-x-2 mt-4">
                      <select
                        value={application.status}
                        onChange={(e) => handleStatusUpdate(application.id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="SUBMITTED">Submitted</option>
                        <option value="SCREENING">Screening</option>
                        <option value="SHORTLISTED">Shortlisted</option>
                        <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                        <option value="OFFERED">Offered</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                      
                      <button
                        onClick={() => openChat(application.user.id, `${application.user.firstName} ${application.user.lastName}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-brandGreen text-white rounded-md hover:bg-darkGreen transition-colors text-sm"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Message
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white shadow rounded-lg">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              No one has applied to this job yet. Share it to get more applicants!
            </p>
          </div>
        )}
      </div>
      
      {/* Chat Window */}
      {chatState.isOpen && chatState.otherUserId && chatState.otherUserName && (
        <ChatWindow
          otherUserId={chatState.otherUserId}
          otherUserName={chatState.otherUserName}
          onClose={closeChat}
        />
      )}
    </div>
  );
}