'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, ApiError } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      toast('Welcome back!', 'success');
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-elevated p-8 border border-surface-100">
      {/* Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-500 shadow-glow mb-4">
          <span className="text-2xl">🍽️</span>
        </Link>
        <h1 className="text-2xl font-bold text-surface-900">Welcome back</h1>
        <p className="text-sm text-surface-500 mt-1">Sign in to your restaurant dashboard</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-danger-light text-danger text-sm flex items-center gap-2 animate-[slide-down_0.2s_ease-out]">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="you@restaurant.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
          Sign In
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-surface-500 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
          Create one
        </Link>
      </p>

      {/* Demo credentials hint */}
      <div className="mt-6 p-3 rounded-lg bg-surface-50 border border-surface-200">
        <p className="text-xs text-surface-500 text-center">
          <span className="font-medium text-surface-600">Demo:</span>{' '}
          owner@demo.com / DemoPass123
        </p>
      </div>
    </div>
  );
}
