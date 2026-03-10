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
  name: z.string().min(1, 'Required').max(200),
  description: z.string().max(5000).optional().or(z.literal('')),
  price: z.coerce.number().min(0, 'Price must be ≥ 0'),
  stock: z.coerce.number().int('Must be a whole number').min(0, 'Stock must be ≥ 0'),
});
type FormData = z.infer<typeof schema>;

export default function EditInventoryItemPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.input<typeof schema>, unknown, FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    api.get(`/inventory/${id}`).then((r) => {
      reset({ ...r.data, description: r.data.description ?? '' });
    }).finally(() => setLoading(false));
  }, [id, reset]);

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      await api.patch(`/inventory/${id}`, { ...data, description: data.description || undefined });
      router.push('/inventory');
    } catch (err) {
      const e = err as AxiosError<{ message: string }>;
      setApiError(e.response?.data?.message || 'Failed to update item');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    await api.delete(`/inventory/${id}`);
    router.push('/inventory');
  };

  if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading…</div>;

  return (
    <div className="p-8 max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/inventory" className="text-gray-400 hover:text-gray-600">←</Link>
        <h2 className="text-2xl font-bold text-gray-800">Edit Inventory Item</h2>
      </div>

      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{apiError}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input {...register('name')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea {...register('description')} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input {...register('price')} type="number" step="0.01" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input {...register('stock')} type="number" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </button>
          <Link href="/inventory" className="px-5 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition">
            Cancel
          </Link>
          <button type="button" onClick={handleDelete} className="ml-auto px-5 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-100 transition">
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
