'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCustomerSession } from '@/lib/customer-context';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { OrderDto } from '@sdm/shared';

export default function CustomerProfilePage() {
  const params = useParams();
  const restaurantSlug = params.restaurantSlug as string;
  const { session, isLoading } = useCustomerSession();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [reference, setReference] = useState('');
  const [lookupMessage, setLookupMessage] = useState('');

  useEffect(() => {
    if (!session) {
      setOrdersLoading(false);
      return;
    }
    api.get<OrderDto[]>('/customer/orders')
      .then(setOrders)
      .catch((error) => {
        if (!(error instanceof ApiError && error.status === 401)) {
          console.error(error);
        }
      })
      .finally(() => setOrdersLoading(false));
  }, [session]);

  const findOrder = async () => {
    setLookupMessage('');
    const orderNumber = Number(reference);
    if (!Number.isInteger(orderNumber) || orderNumber < 1) {
      setLookupMessage('Enter the order number shown on your receipt.');
      return;
    }
    try {
      const matches = await api.get<OrderDto[]>(`/customer/orders?orderNumber=${orderNumber}`);
      if (matches.length === 0) {
        setLookupMessage('No order with that reference was found in this table session.');
        return;
      }
      window.location.href = `/m/${restaurantSlug}/order/${matches[0].id}`;
    } catch (error) {
      setLookupMessage(error instanceof ApiError ? error.message : 'Could not find that order.');
    }
  };

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

      {session && (
        <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-surface-900">Track your orders</h2>
          <p className="mt-1 text-sm text-surface-500">
            Your orders from this table session appear here, even if you forget the order number.
          </p>
          <div className="mt-4 flex gap-2">
            <input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              inputMode="numeric"
              placeholder="Order number"
              className="min-w-0 flex-1 rounded-xl border border-surface-200 px-3 py-2.5 text-sm"
            />
            <button
              type="button"
              onClick={findOrder}
              className="rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Track
            </button>
          </div>
          {lookupMessage && <p className="mt-2 text-xs text-danger">{lookupMessage}</p>}
          {ordersLoading ? (
            <p className="mt-5 text-sm text-surface-500">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="mt-5 text-sm text-surface-500">No orders placed yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/m/${restaurantSlug}/order/${order.id}`}
                  className="flex items-center justify-between rounded-xl border border-surface-200 p-4 hover:border-primary-300"
                >
                  <div>
                    <p className="font-bold text-surface-900">Order #{order.orderNumber}</p>
                    <p className="text-xs text-surface-500">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary-600">Track →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
