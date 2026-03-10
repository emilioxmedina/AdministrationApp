'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AxiosError } from 'axios';

const schema = z.object({
  first_name: z.string().min(1, 'Requerido').max(100),
  last_name: z.string().min(1, 'Requerido').max(100),
  email: z.string().email('Correo inválido'),
  phone: z.string().regex(/^\+?[\d\s\-().]{7,20}$/, 'Número de teléfono inválido').optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    api.get(`/employees/${id}`).then((r) => {
      reset({ ...r.data, phone: r.data.phone ?? '' });
    }).finally(() => setLoading(false));
  }, [id, reset]);

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      await api.patch(`/employees/${id}`, { ...data, phone: data.phone || undefined });
      router.push('/employees');
    } catch (err) {
      const e = err as AxiosError<{ message: string }>;
      setApiError(e.response?.data?.message || 'Error al actualizar el empleado');
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este empleado?')) return;
    await api.delete(`/employees/${id}`);
    router.push('/employees');
  };

  if (loading) return <div className="p-8 text-gray-400 animate-pulse">Cargando…</div>;

  return (
    <div className="p-8 max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/employees" className="text-gray-400 hover:text-gray-600">←</Link>
        <h2 className="text-2xl font-bold text-gray-800">Editar empleado</h2>
      </div>

      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{apiError}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input {...register('first_name')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900" />
            {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
            <input {...register('last_name')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900" />
            {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
          <input {...register('email')} type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono <span className="text-gray-400 font-normal">(opcional)</span></label>
          <input {...register('phone')} type="tel" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900" />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
            {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <Link href="/employees" className="px-5 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition">
            Cancelar
          </Link>
          <button type="button" onClick={handleDelete} className="ml-auto px-5 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-100 transition">
            Eliminar
          </button>
        </div>
      </form>
    </div>
  );
}
