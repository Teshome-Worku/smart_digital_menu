'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCustomerSession } from '@/lib/customer-context';

export default function CustomerProfilePage() {
  const params = useParams();
  const restaurantSlug = params.restaurantSlug as string;
  const { session, isLoading } = useCustomerSession();

  if (isLoading) {
    return <div className="p-8 text-center text-surface-500">Loading table session...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">
        <h1 className="text-xl font-bold text-surface-900">Your table</h1>
        {session ? (
          <>
            <p className="mt-3 text-surface-700">
              You are ordering from <strong>{session.tableName}</strong>.
            </p>
            <p className="mt-1 text-sm text-surface-500">
              This table session expires at {new Date(session.expiresAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}.
            </p>
          </>
        ) : (
          <>
            <p className="mt-3 text-surface-600">
              Scan the table QR code to start an order.
            </p>
            <Link
              href={`/m/${restaurantSlug}/home`}
              className="inline-flex mt-5 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Browse menu
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
