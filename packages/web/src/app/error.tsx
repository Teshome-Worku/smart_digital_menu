'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client-side rendering errors cleanly without sensitive details
    console.error('[Application Error]', error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold text-surface-900">Something went wrong</h1>
        <p className="text-surface-600 text-sm">
          An error occurred while loading this page. Please try refreshing.
        </p>
        <button
          onClick={() => reset()}
          className="w-full bg-surface-900 text-white rounded-xl py-3.5 font-semibold hover:bg-surface-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
