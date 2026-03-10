'use client';

import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/contexts/auth-context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm animate-pulse">Cargando…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}
