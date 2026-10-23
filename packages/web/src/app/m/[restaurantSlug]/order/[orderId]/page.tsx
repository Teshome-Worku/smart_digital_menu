'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

type OrderDto = {
  orderNumber: string | number;
  status: OrderStatus;
  createdAt: string;
  subtotal: number;
  total: number;
  payments?: Array<{
    method: 'CASH' | 'CHAPA';
    status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
    amount: number;
    currency: string;
  }>;
  items: Array<{
    id: string;
    quantity: number;
    productNameSnapshot: string;
    unitPriceSnapshot: number;
    modifiers: Array<{
      modifierNameSnapshot: string;
      priceDeltaSnapshot: number;
    }>;
  }>;
};

const STATUS_MESSAGES: Record<OrderStatus, { title: string, subtitle: string, icon: string, color: string }> = {
  PENDING: { title: 'Sending to Kitchen', subtitle: 'Waiting for the kitchen to accept your order.', icon: '📡', color: 'bg-surface-200 text-surface-600' },
  ACCEPTED: { title: 'Order Accepted', subtitle: 'The kitchen has received your order.', icon: '👍', color: 'bg-blue-100 text-blue-600' },
  PREPARING: { title: 'Preparing', subtitle: 'Your food is being prepared right now.', icon: '🍳', color: 'bg-amber-100 text-amber-600' },
  READY: { title: 'Ready to Serve', subtitle: 'Your order is ready and will be brought to your table shortly!', icon: '✨', color: 'bg-green-100 text-green-600' },
  COMPLETED: { title: 'Completed', subtitle: 'Enjoy your meal!', icon: '✅', color: 'bg-green-100 text-green-600' },
  CANCELLED: { title: 'Cancelled', subtitle: 'This order was cancelled.', icon: '❌', color: 'bg-red-100 text-red-600' },
};

export default function CustomerOrderPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantSlug = params.restaurantSlug as string;
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<OrderDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const copyOrderReference = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(String(order.orderNumber));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const fetchOrder = async () => {
    try {
      const response = await api.get<OrderDto>(`/customer/orders/${orderId}`);
      setOrder(response);
    } catch (err) {
      console.error(err);
      // Could push to home if not found
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Poll for status updates every 10 seconds
    const intervalId = setInterval(() => {
      fetchOrder();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [orderId]);

  if (isLoading && !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-surface-200 border-t-primary-500 rounded-full animate-spin"></div>
        <p className="text-surface-500">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold mb-4">Order not found</h1>
        <Link href={`/m/${restaurantSlug}/home`} className="text-primary-600 underline">Return Home</Link>
      </div>
    );
  }

  const currentStatus = STATUS_MESSAGES[order.status];
  const payment = order.payments?.[0];

  return (
    <div className="min-h-screen bg-surface-50 pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-surface-200 sticky top-14 z-30 flex items-center gap-3 shadow-sm">
        <Link 
          href={`/m/${restaurantSlug}/home`}
          className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-surface-600 hover:bg-surface-200"
        >
          ✕
        </Link>
        <h1 className="text-lg font-bold text-surface-900">Order #{order.orderNumber}</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Card */}
        <div className="bg-white rounded-2xl border border-surface-200 p-6 text-center shadow-sm">
          <div className="mb-5 rounded-xl bg-primary-50 border border-primary-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">Your order reference</p>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="text-2xl font-black text-surface-900">#{order.orderNumber}</span>
              <button
                type="button"
                onClick={copyOrderReference}
                className="rounded-lg border border-primary-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-primary-700"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="mt-2 text-xs text-surface-500">Save this number to check your order status later.</p>
          </div>
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-4 ${currentStatus.color}`}>
            {currentStatus.icon}
          </div>
          <h2 className="text-2xl font-bold text-surface-900 mb-2">{currentStatus.title}</h2>
          <p className="text-surface-600">{currentStatus.subtitle}</p>
          
          <div className="mt-6 flex justify-center gap-2">
            {['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].map((step, index) => {
              const isActive = order.status === step || 
                              (order.status === 'COMPLETED') ||
                              (order.status === 'READY' && index <= 3) ||
                              (order.status === 'PREPARING' && index <= 2) ||
                              (order.status === 'ACCEPTED' && index <= 1);
                              
              return (
                <div 
                  key={step} 
                  className={`h-2 flex-1 rounded-full ${isActive ? 'bg-primary-500' : 'bg-surface-200'} transition-colors duration-500`}
                />
              );
            })}
          </div>
        </div>

        {/* Order Details */}
        {payment && (
          <div className="bg-white rounded-2xl border border-surface-200 p-4 shadow-sm">
            <div className="flex justify-between text-sm items-center">
              <span className="font-bold text-surface-900">Payment</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                payment.status === 'PAID'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-amber-100 text-amber-700 border border-amber-200'
              }`}>
                {payment.method} · {payment.status}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-surface-500">
              {payment.method === 'CASH'
                ? 'Pay at the counter. Staff will confirm receipt.'
                : payment.status === 'PAID'
                ? 'Online payment verified successfully via Chapa.'
                : 'Payment pending. Checking confirmation with Chapa...'}
            </p>
          </div>
        )}
        <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-surface-100 bg-surface-50 flex justify-between items-center">
            <h3 className="font-bold text-surface-900">Receipt</h3>
            <span className="text-xs text-surface-500">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          
          <div className="p-4 space-y-4">
            {order.items.map((item) => {
              const modsTotal = item.modifiers.reduce((s, m) => s + m.priceDeltaSnapshot, 0);
              const unitPrice = item.unitPriceSnapshot + modsTotal;
              const lineTotal = unitPrice * item.quantity;
              const currency = payment?.currency || 'USD';
              const formattedLineTotal = currency === 'ETB' ? `${lineTotal.toFixed(2)} ETB` : `$${lineTotal.toFixed(2)}`;
              
              return (
                <div key={item.id} className="flex justify-between items-start gap-4">
                  <div>
                    <div className="font-semibold text-surface-900 text-sm">
                      <span className="text-surface-500 mr-2">{item.quantity}x</span>
                      {item.productNameSnapshot}
                    </div>
                    {item.modifiers.length > 0 && (
                      <div className="text-xs text-surface-500 mt-1 pl-6">
                        {item.modifiers.map(m => m.modifierNameSnapshot).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="font-semibold text-surface-900 text-sm">
                    {formattedLineTotal}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="p-4 bg-surface-50 border-t border-surface-100 space-y-2">
            <div className="flex justify-between text-sm text-surface-600">
              <span>Subtotal</span>
              <span>{payment?.currency === 'ETB' ? `${order.subtotal.toFixed(2)} ETB` : `$${order.subtotal.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-surface-900 pt-2 border-t border-surface-200">
              <span>Total</span>
              <span>{payment?.currency === 'ETB' ? `${order.total.toFixed(2)} ETB` : `$${order.total.toFixed(2)}`}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
