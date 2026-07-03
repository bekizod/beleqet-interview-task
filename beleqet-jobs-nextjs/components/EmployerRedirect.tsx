'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGetProfileQuery } from '@/lib/store/slices/usersApiSlice';

/**
 * Wrap job-seeker-only pages with this component.
 * If the logged-in user is an EMPLOYER or ADMIN, they get redirected to /my-jobs.
 */
export default function EmployerRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  const isEmployer = profile?.role === 'EMPLOYER' || profile?.role === 'ADMIN';

  useEffect(() => {
    if (!authLoading && !profileLoading && isEmployer) {
      router.replace('/my-jobs');
    }
  }, [authLoading, profileLoading, isEmployer, router]);

  // While we're figuring out the role, show nothing to avoid flash
  if (isAuthenticated && profileLoading) return null;

  // Employer — will be redirected, don't render the page content
  if (isEmployer) return null;

  return <>{children}</>;
}
