'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, ApiError } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { register } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = 'Name must be at least 2 characters';
    if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) errors.password = 'Must include an uppercase letter';
    if (!/[0-9]/.test(password)) errors.password = 'Must include a number';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      await register(name, email, password);
      toast('Account created! Welcome to Smart Digital Menu.', 'success');
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
        <h1 className="text-2xl font-bold text-surface-900">Create your account</h1>
        <p className="text-sm text-surface-500 mt-1">Start managing your restaurant digitally</p>
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
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          required
          autoComplete="name"
        />
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
          placeholder="Min 8 chars, uppercase + number"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          hint="At least 8 characters with one uppercase letter and one number"
          required
          autoComplete="new-password"
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
          required
          autoComplete="new-password"
        />

        <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
          Create Account
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-surface-500 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
