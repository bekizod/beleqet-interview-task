'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useGetMyApplicationsQuery } from '@/lib/store/slices/applicationsApiSlice';
import { Briefcase, MapPin, Calendar, CheckCircle, Clock, XCircle, Star, CalendarClock, Gift, Search, SendHorizonal, Undo2, MessageCircle } from 'lucide-react';
import { useChatWindow } from '@/lib/hooks/useChatWindow';
import ChatWindow from '@/components/ChatWindow';

export default function ApplicationsPage() {
  const { isAuthenticated } = useAuth();
  const { chatState, openChat, closeChat } = useChatWindow();
  const { data: applications, isLoading } = useGetMyApplicationsQuery(undefined, {
    skip: !isAuthenticated,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'SCREENING':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'SHORTLISTED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'INTERVIEW_SCHEDULED':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'OFFERED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'WITHDRAWN':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
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
        <p className="text-gray-600">Please log in to view your applications</p>
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
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600 mt-2">Track your job application status</p>
        </div>

        {applications && applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((application) => {
              const isInterview = application.status === 'INTERVIEW_SCHEDULED';
              const isOffered   = application.status === 'OFFERED';
              const isRejected  = application.status === 'REJECTED';
              const isShortlisted = application.status === 'SHORTLISTED';

              return (
                <div
                  key={application.id}
                  className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow border-l-4 ${
                    isOffered     ? 'border-l-emerald-500' :
                    isInterview   ? 'border-l-indigo-400' :
                    isShortlisted ? 'border-l-green-500'  :
                    isRejected    ? 'border-l-red-400'    :
                                    'border-l-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">

                      {/* Title + status badge */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{application.job.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                          {application.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Company / location / applied date */}
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-1 text-gray-400" />
                          {application.job.company.name}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          {application.job.location}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          Applied {new Date(application.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* ── SHORTLISTED banner ── */}
                      {isShortlisted && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
                          <Star className="h-4 w-4 text-green-600 shrink-0" />
                          <span><strong>You've been shortlisted!</strong> The employer is reviewing top candidates. An interview invitation may follow.</span>
                        </div>
                      )}

                      {/* ── INTERVIEW_SCHEDULED banner ── */}
                      {isInterview && (
                        <div className="mt-3 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3">
                          <div className="flex items-center gap-2 text-indigo-800 font-semibold text-sm mb-1">
                            <CalendarClock className="h-4 w-4 shrink-0" />
                            Interview Scheduled
                          </div>
                          {application.interviewSlot ? (
                            <p className="text-sm text-indigo-700">
                              <span className="font-medium">
                                {new Date(application.interviewSlot).toLocaleDateString('en-US', {
                                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                })}
                              </span>
                              {' at '}
                              <span className="font-medium">
                                {new Date(application.interviewSlot).toLocaleTimeString('en-US', {
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </span>
                            </p>
                          ) : (
                            <p className="text-sm text-indigo-600">Interview details will be shared via notification.</p>
                          )}
                        </div>
                      )}

                      {/* ── OFFERED banner ── */}
                      {isOffered && (
                        <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
                          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm mb-1">
                            <Gift className="h-4 w-4 shrink-0" />
                            Offer Extended 🎉
                          </div>
                          <p className="text-sm text-emerald-700">Congratulations! You have received a job offer. Please check your notifications for next steps.</p>
                        </div>
                      )}

                      {/* ── REJECTED notes ── */}
                      {isRejected && application.notes && (
                        <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
                          <p className="font-medium mb-0.5">Feedback</p>
                          <p>{application.notes}</p>
                        </div>
                      )}

                      {/* Cover letter preview */}
                      {application.coverLetter && !isOffered && !isInterview && (
                        <p className="mt-3 text-sm text-gray-700 line-clamp-2">{application.coverLetter}</p>
                      )}

                      {/* AI score */}
                      {application.score && (
                        <div className="mt-3 p-3 bg-purple-50 border border-purple-100 rounded-md">
                          <p className="text-xs font-semibold text-purple-800 mb-1.5">AI Screening Score</p>
                          <div className="flex items-center gap-4 text-sm text-purple-700">
                            <span>Overall: <strong>{application.score.overallScore.toFixed(0)}</strong></span>
                            <span>Skills: <strong>{application.score.skillScore.toFixed(0)}</strong></span>
                            <span>Experience: <strong>{application.score.experienceScore.toFixed(0)}</strong></span>
                          </div>
                          {application.score.reasoning && (
                            <p className="mt-1.5 text-xs text-purple-600 italic">{application.score.reasoning}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="ml-4 shrink-0 flex flex-col items-end gap-2">
                      {getStatusIcon(application.status)}
                      
                      <button
                        onClick={() => openChat(application.job.company.userId, application.job.company.name)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brandGreen text-white rounded-md hover:bg-darkGreen transition-colors text-xs"
                        title="Contact employer"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Message
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white shadow rounded-lg">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
            <p className="mt-1 text-sm text-gray-500">Start applying to jobs to track your progress here.</p>
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
