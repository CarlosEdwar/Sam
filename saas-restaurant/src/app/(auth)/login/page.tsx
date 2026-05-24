'use client';

import { useState } from 'react';
import { login } from '@/lib/services/auth-service';
import { Button, Input, Card } from '@/components/ui';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    try {
      const result = await login(formData);
      
      if (result.error) {
        setError(result.error);
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md" title="Acesso ao Sistema">
        <form action={handleSubmit} className="space-y-4">
          <Input
            label="E-mail"
            name="email"
            type="email"
            placeholder="seu@email.com"
            required
          />
          
          <Input
            label="Senha"
            name="password"
            type="password"
            placeholder="••••••"
            required
          />

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
