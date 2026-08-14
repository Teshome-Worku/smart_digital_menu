'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';

export default function QRScannerPage() {
  const params = useParams();
  const router = useRouter();
  const qrToken = params.qrToken as string;

  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!qrToken) return;

    let isMounted = true;

    async function processQRCode() {
      try {
        const response = await api.post<{ restaurantSlug: string }>('/customer/scan', { qrToken });
        if (isMounted) {
          // Redirect to the restaurant's home page
          router.replace(`/m/${response.restaurantSlug}/home`);
        }
      } catch (err) {
        if (isMounted) {
          setStatus('error');
          if (err instanceof ApiError) {
            setErrorMessage(err.message);
          } else {
            setErrorMessage('A network error occurred while connecting to the restaurant.');
          }
        }
      }
    }

    processQRCode();

    return () => {
      isMounted = false;
    };
  }, [qrToken, router]);

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full space-y-6">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Scan Failed</h1>
          <p className="text-surface-600">
            {errorMessage || 'This QR code is invalid or has expired.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-surface-900 text-white rounded-xl py-3.5 font-semibold hover:bg-surface-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-semibold text-white">Preparing your menu...</h2>
        <p className="text-surface-400 mt-2">Connecting to your table</p>
      </div>
    </div>
  );
}
