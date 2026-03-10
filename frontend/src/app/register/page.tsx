'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { AxiosError } from 'axios';

const schema = z.object({
  username: z.string().min(1, 'El nombre de usuario es requerido').max(100),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum(['admin', 'viewer']).optional(),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'viewer' },
  });

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      await registerUser(data.username, data.email, data.password, data.role);
      router.push('/login');
    } catch (err) {
      const e = err as AxiosError<{ message: string }>;
      setApiError(e.response?.data?.message || 'El registro falló. Por favor intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-indigo-700">Crear cuenta</h1>
          <p className="text-sm text-gray-500 mt-1">Únete al Admin App</p>
        </div>

        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de usuario</label>
            <input
              {...register('username')}
              placeholder="juanperez"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900"
            />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input
              {...register('email')}
              type="email"
              placeholder="tu@ejemplo.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              {...register('password')}
              type="password"
              placeholder="Mín. 8 caracteres"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              {...register('role')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900"
            >
              <option value="viewer">Visor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-indigo-600 font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>

        <Link
          href="/"
          className="flex items-center justify-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition"
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
