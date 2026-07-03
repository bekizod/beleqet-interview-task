'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCheckAdminsQuery } from '@/lib/store/slices/adminApiSlice';

export default function AdminPage() {
    const router = useRouter();
    const { data: adminCheck, isLoading } = useCheckAdminsQuery();

    useEffect(() => {
        if (!isLoading) {
            if (adminCheck?.hasAdmins) {
                router.push('/admin/login');
            } else {
                router.push('/admin/register');
            }
        }
    }, [adminCheck, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Checking system status...</p>
                </div>
            </div>
        );
    }

    return null;
}
