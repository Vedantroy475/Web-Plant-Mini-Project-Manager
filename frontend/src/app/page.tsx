'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, type RootState } from '@/store/hooks';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, initializing } = useAppSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!initializing) {
      router.replace(isAuthenticated ? '/dashboard' : '/login');
    }
  }, [isAuthenticated, initializing, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
}