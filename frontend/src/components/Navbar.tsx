'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FolderKanban, LogOut, User as UserIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector, type RootState } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';

export default function Navbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors"
        >
          <FolderKanban className="h-6 w-6 text-blue-600" />
          <span>Mini Project Manager</span>
        </Link>

        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden items-center gap-2 text-sm text-slate-600 sm:flex">
              <UserIcon className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-slate-800">{user.name}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}