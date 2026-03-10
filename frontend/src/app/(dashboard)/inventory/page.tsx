'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

interface InventoryItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  created_at: string;
}

export default function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/inventory').then((r) => setItems(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este Producto?')) return;
    await api.delete(`/inventory/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Inventario</h2>
        {isAdmin && (
          <Link
            href="/inventory/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            + Agregar Producto
          </Link>
        )}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre…"
        className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900"
      />

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-lg h-12 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">No se encontraron Productos.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                {['Nombre', 'Descripción', 'Precio', 'Stock', 'Acciones'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{item.description || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">Q{Number(item.price).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {isAdmin && (
                        <>
                          <Link href={`/inventory/${item.id}`} className="text-indigo-600 hover:underline">Editar</Link>
                          <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:underline">Eliminar</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
