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
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (err) {
      const e = err as AxiosError<{ message: string }>;
      setApiError(e.response?.data?.message || 'Correo o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-indigo-700">Bienvenido de nuevo</h1>
          <p className="text-sm text-gray-500 mt-1">Inicia sesión en tu cuenta</p>
        </div>

        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-indigo-600 font-medium hover:underline">
            Regístrate
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
