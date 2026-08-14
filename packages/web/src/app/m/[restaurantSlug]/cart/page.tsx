'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/lib/store/cartStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import type { CreateOrderRequest, OrderDto } from '@sdm/shared';

export default function CustomerCartPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const restaurantSlug = params.restaurantSlug as string;

  const { items, getSubtotal, updateQuantity, removeItem, clearCart, restaurantId: cartRestaurantId } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  // Protect against cart from another restaurant
  if (items.length > 0 && cartRestaurantId !== restaurantSlug) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center text-2xl mb-4">🛒</div>
        <h2 className="text-xl font-bold text-surface-900 mb-2">Cart mismatch</h2>
        <p className="text-surface-500 mb-6">You have items from another restaurant in your cart. Do you want to clear it?</p>
        <Button onClick={clearCart}>Clear Cart</Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center text-3xl mb-4 opacity-50">🛒</div>
        <h2 className="text-xl font-bold text-surface-900 mb-2">Your cart is empty</h2>
        <p className="text-surface-500 mb-8 max-w-xs">Looks like you haven't added anything to your order yet.</p>
        <Link href={`/m/${restaurantSlug}/menu`}>
          <Button>Browse Menu</Button>
        </Link>
      </div>
    );
  }

  const subtotal = getSubtotal();

  const handleCheckout = async () => {
    try {
      setIsSubmitting(true);

      const payload: CreateOrderRequest = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          modifiers: item.modifiers.map(m => ({ modifierId: m.modifierId }))
        })),
        notes: notes || undefined
      };

      const order = await api.post<OrderDto>('/customer/orders', payload);
      
      clearCart();
      toast('Order sent to the kitchen!', 'success');
      router.push(`/m/${restaurantSlug}/order/${order.id}`);
      
    } catch (err: any) {
      toast(err.message || 'Failed to submit order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 pb-32">
      <div className="bg-white px-4 py-4 border-b border-surface-200 sticky top-14 z-30 flex items-center justify-between">
        <h1 className="text-xl font-bold text-surface-900">Your Order</h1>
        <button onClick={clearCart} className="text-sm font-semibold text-danger hover:underline">
          Clear
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-sm">
          {items.map((item, idx) => {
            const itemModsTotal = item.modifiers.reduce((sum, m) => sum + m.priceDelta, 0);
            const unitPrice = item.price + itemModsTotal;
            const lineTotal = unitPrice * item.quantity;

            return (
              <div key={item.id} className={`p-4 flex gap-4 ${idx > 0 ? 'border-t border-surface-100' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-bold text-surface-900 text-sm leading-tight">{item.name}</h3>
                    <span className="font-bold text-surface-900 text-sm shrink-0">${lineTotal.toFixed(2)}</span>
                  </div>
                  
                  {item.modifiers.length > 0 && (
                    <div className="text-xs text-surface-500 mb-2 leading-relaxed">
                      {item.modifiers.map(m => m.name).join(', ')}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center bg-surface-100 rounded-lg border border-surface-200 h-8">
                      <button 
                        onClick={() => item.quantity === 1 ? removeItem(item.id) : updateQuantity(item.id, -1)}
                        className="w-8 h-full flex items-center justify-center text-surface-600 hover:bg-surface-200 transition-colors"
                      >
                        {item.quantity === 1 ? '🗑️' : '-'}
                      </button>
                      <span className="w-6 text-center text-xs font-semibold text-surface-900">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-full flex items-center justify-center text-surface-600 hover:bg-surface-200 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Notes */}
        <div className="bg-white rounded-2xl border border-surface-200 p-4 shadow-sm">
          <label className="block text-sm font-bold text-surface-900 mb-2">Add a note (optional)</label>
          <textarea 
            className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
            rows={2}
            placeholder="e.g. No onions please"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        
        {/* Receipt Summary */}
        <div className="bg-white rounded-2xl border border-surface-200 p-4 space-y-3 shadow-sm">
          <div className="flex justify-between text-sm text-surface-600">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {/* Tax/fees could go here later */}
          <div className="border-t border-surface-100 pt-3 flex justify-between font-bold text-lg text-surface-900">
            <span>Total</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-surface-200 p-4 max-w-md mx-auto shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-40">
        <Button 
          className="w-full h-12 text-base font-semibold shadow-sm"
          isLoading={isSubmitting}
          onClick={handleCheckout}
        >
          Submit Order • ${subtotal.toFixed(2)}
        </Button>
      </div>
    </div>
  );
}
