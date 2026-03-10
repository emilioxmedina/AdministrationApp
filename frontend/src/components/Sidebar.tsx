'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

const navItems = [
  { href: '/dashboard', label: 'Panel', icon: '🏠' },
  { href: '/employees', label: 'Empleados', icon: '👥' },
  { href: '/inventory', label: 'Inventario', icon: '📦' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-indigo-800 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-indigo-700">
        <h1 className="text-xl font-bold tracking-tight">Admin App</h1>
        <p className="text-xs text-indigo-300 mt-1 capitalize">Cuenta {user?.role === 'admin' ? 'administrador' : user?.role === 'viewer' ? 'visor' : '…'}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                active
                  ? 'bg-indigo-900 text-white'
                  : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-indigo-700 space-y-2">
        <p className="text-xs text-indigo-300 truncate">{user?.email}</p>
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-indigo-200 hover:text-white transition px-1"
        >
          ← Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
