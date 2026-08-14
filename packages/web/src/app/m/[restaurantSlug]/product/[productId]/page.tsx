'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { PublicProductDto } from '@sdm/shared';
import { Button } from '@/components/ui/button';

export default function CustomerProductPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantSlug = params.restaurantSlug as string;
  const productId = params.productId as string;

  const [product, setProduct] = useState<PublicProductDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await api.get<PublicProductDto>(`/customer/${restaurantSlug}/products/${productId}`);
        setProduct(response);
      } catch (err) {
        console.error(err);
        // Could show a toast, but usually just go back
        router.back();
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [restaurantSlug, productId, router]);

  if (isLoading) {
    return (
      <div className="animate-pulse bg-white min-h-screen">
        <div className="h-64 bg-surface-200 w-full"></div>
        <div className="p-4 space-y-4">
          <div className="h-8 bg-surface-200 w-3/4 rounded"></div>
          <div className="h-6 bg-surface-200 w-1/4 rounded"></div>
          <div className="h-24 bg-surface-200 w-full rounded mt-6"></div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="bg-white min-h-[calc(100vh-4rem)] flex flex-col relative">
      {/* Back button overlay */}
      <button 
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full shadow-sm flex items-center justify-center text-surface-900 border border-surface-200/50 active:scale-95 transition-transform"
      >
        ←
      </button>

      {/* Image Header */}
      <div className="w-full h-72 bg-surface-100 relative">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">
            🍽️
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-6 pb-28">
        <div className="flex justify-between items-start gap-4 mb-2">
          <h1 className="text-2xl font-bold text-surface-900 leading-tight">{product.name}</h1>
          <div className="text-xl font-bold text-primary-600">${product.price.toFixed(2)}</div>
        </div>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {product.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-surface-100 text-surface-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-surface-200">
                {tag}
              </span>
            ))}
          </div>
        )}

        <p className="text-surface-600 leading-relaxed text-[15px] mb-8">
          {product.description || 'No description provided.'}
        </p>

        {/* Modifiers (Stub for Phase 4) */}
        {product.modifierGroups && product.modifierGroups.length > 0 && (
          <div className="space-y-6 mb-8">
            <h3 className="font-bold text-surface-900 border-b border-surface-100 pb-2">Customizations</h3>
            <p className="text-sm text-surface-500 italic">Modifier selection will be available in Phase 4.</p>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar (Sits above the layout bottom nav) */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-surface-200 p-4 max-w-md mx-auto shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-surface-100 rounded-xl border border-surface-200 overflow-hidden">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-12 h-12 flex items-center justify-center text-surface-600 hover:bg-surface-200 active:bg-surface-300 transition-colors"
            >
              -
            </button>
            <span className="w-8 text-center font-semibold text-surface-900">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-12 h-12 flex items-center justify-center text-surface-600 hover:bg-surface-200 active:bg-surface-300 transition-colors"
            >
              +
            </button>
          </div>
          
          <Button 
            className="flex-1 h-12 text-base font-semibold shadow-sm"
            onClick={() => {
              alert('Cart functionality will be implemented in Phase 4!');
            }}
          >
            Add to Order • ${(product.price * quantity).toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  );
}
