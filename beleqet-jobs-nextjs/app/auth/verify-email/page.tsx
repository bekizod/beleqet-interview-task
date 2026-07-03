'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVerifyEmailMutation } from '@/lib/store/slices/authApiSlice';
import toast from 'react-hot-toast';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();
  const [token, setToken] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      toast.error('Invalid verification link');
      // router.push('/login');
    } else {
      setToken(tokenParam);
      handleVerification(tokenParam);
    }
  }, [searchParams, router]);

  const handleVerification = async (verificationToken: string) => {
    try {
      await verifyEmail({ token: verificationToken }).unwrap();
      setVerified(true);
      toast.success('Email verified successfully!');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to verify email. The link may have expired.');
      router.push('/login');
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {verified ? (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Email Verified!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Your email has been successfully verified. You can now log in to your account.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Go to login
              </button>
            </>
          ) : (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Verifying your email...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we verify your email address.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
