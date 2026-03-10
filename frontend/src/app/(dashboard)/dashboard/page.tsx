'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

interface Stats {
  totalEmployees: number;
  totalItems: number;
  totalValue: number;
  lowStock: number;
}

function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm flex items-start gap-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [empRes, invRes] = await Promise.all([
          api.get('/employees'),
          api.get('/inventory'),
        ]);
        const employees: { id: number }[] = empRes.data;
        const items: { price: number; stock: number }[] = invRes.data;
        setStats({
          totalEmployees: employees.length,
          totalItems: items.length,
          totalValue: items.reduce((sum, i) => sum + Number(i.price) * i.stock, 0),
          lowStock: items.filter((i) => i.stock < 5).length,
        });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Panel</h2>
        <p className="text-gray-500 text-sm mt-1">Bienvenido de nuevo, {user?.email}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-28" />
          ))}
        </div>
      ) : error || !stats ? (
        <p className="text-red-500 text-sm">Error al cargar los datos. Por favor recarga la página.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="👥" label="Total de empleados" value={stats.totalEmployees} />
          <StatCard icon="📦" label="Productos en inventario" value={stats.totalItems} />
          <StatCard
            icon="💰"
            label="Valor del inventario"
            value={`Q${stats.totalValue.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`}
            sub="valor total en stock"
          />
          <StatCard
            icon="⚠️"
            label="Stock bajo"
            value={stats.lowStock}
            sub="Productos con stock < 5"
          />
        </div>
      )}
    </div>
  );
}
