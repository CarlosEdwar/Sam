'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/lib/services/auth-service';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const result = await login(formData);

      if (result.error) {
        setError(result.error);
      } else {
        router.push(redirect);
        router.refresh();
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 p-4 sm:p-6">
      {/* Background Decorative Elements */}
      <div
        className="absolute -top-[10%] -left-[10%] h-[35%] w-[35%] rounded-full bg-blue-600/10 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-[10%] -right-[10%] h-[35%] w-[35%] rounded-full bg-blue-400/5 blur-[100px]"
        aria-hidden="true"
      />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-500">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="group">
            <div className="rounded-2xl bg-white shadow-xl shadow-blue-500/10 transition-all duration-300 group-hover:scale-105">
              <Image
                src="/Person.png"
                alt="Logo Sam - Sistema de Impressão"
                width={56}
                height={56}
                priority
                className="h-auto w-auto"
              />
            </div>
          </div>
        </div>

        {/* Login Form */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-900/20">
          <div className="p-6 sm:p-8">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Bem-vindo de volta
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Faça login para acessar seu painel
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </section>

        {/* Footer */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-center text-xs text-slate-500">
            Sistema de Gestão de Etiquetas e Estoque • v0.0.1
          </p>
          <Link
            href="#"
            className="text-xs text-slate-400 hover:text-slate-300 transition-colors underline-offset-4 hover:underline"
          >
            Precisa de ajuda? Fale com o suporte.
          </Link>
        </div>
      </div>
    </main>
  );
}
