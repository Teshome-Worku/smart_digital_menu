'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { PublicProductDto } from '@sdm/shared';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/store/cartStore';
import { useToast } from '@/components/ui/toast';

export default function CustomerProductPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantSlug = params.restaurantSlug as string;
  const productId = params.productId as string;

  const [product, setProduct] = useState<PublicProductDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<Set<string>>(new Set());

  const addItem = useCartStore(state => state.addItem);
  const { toast } = useToast();

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

        {/* Modifiers */}
        {product.modifierGroups && product.modifierGroups.length > 0 && (
          <div className="space-y-6 mb-8">
            {product.modifierGroups.map(group => {
              // Calculate how many selected for this group
              const selectedCount = group.modifiers.filter(m => selectedModifiers.has(m.id)).length;
              
              return (
                <div key={group.id} className="space-y-3">
                  <div className="flex justify-between items-baseline border-b border-surface-100 pb-2">
                    <h3 className="font-bold text-surface-900">{group.name}</h3>
                    <span className="text-xs font-medium text-surface-500">
                      {group.required ? 'Required' : 'Optional'}
                      {(group.maxSelections || 0) > 1 ? ` (Max ${group.maxSelections})` : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.modifiers.filter(m => m.isAvailable).map(mod => {
                      const isSelected = selectedModifiers.has(mod.id);
                      return (
                        <label 
                          key={mod.id} 
                          className="flex items-center justify-between p-3 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 active:bg-surface-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox"
                              className="sr-only"
                              checked={isSelected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const newSet = new Set(selectedModifiers);
                                
                                if (checked) {
                                  // Enforce maxSelections
                                  const maxSel = group.maxSelections || 0;
                                  if (maxSel === 1) {
                                    // Radio behavior: uncheck others in this group
                                    group.modifiers.forEach(m => newSet.delete(m.id));
                                    newSet.add(mod.id);
                                  } else if (selectedCount < maxSel || maxSel === 0) {
                                    newSet.add(mod.id);
                                  } else {
                                    // Too many selected
                                    toast(`You can only select up to ${maxSel} options here.`, 'error');
                                    return;
                                  }
                                } else {
                                  newSet.delete(mod.id);
                                }
                                
                                setSelectedModifiers(newSet);
                              }}
                            />
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-primary-500 bg-primary-500 text-white' : 'border-surface-300'}`}>
                              {isSelected && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className="font-medium text-surface-900 text-sm">{mod.name}</span>
                          </div>
                          {mod.priceDelta > 0 && (
                            <span className="text-sm font-semibold text-surface-600">+${mod.priceDelta.toFixed(2)}</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-surface-200 p-4 max-w-md mx-auto shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-surface-100 rounded-xl border border-surface-200 overflow-hidden shrink-0">
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
              // Add to cart
              // First validate required modifiers
              for (const group of product.modifierGroups || []) {
                if (group.required) {
                  const selectedCount = group.modifiers.filter(m => selectedModifiers.has(m.id)).length;
                  if (selectedCount < group.minSelections) {
                    toast(`Please select at least ${group.minSelections} option(s) for ${group.name}`, 'error');
                    return;
                  }
                }
              }

              const cartModifiers = Array.from(selectedModifiers).map(id => {
                const group = product.modifierGroups?.find(g => g.modifiers.some(m => m.id === id));
                const mod = group?.modifiers.find(m => m.id === id);
                return {
                  modifierId: id,
                  name: mod?.name || '',
                  priceDelta: mod?.priceDelta || 0
                };
              });

              addItem(restaurantSlug, {
                productId: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                quantity,
                modifiers: cartModifiers
              });

              toast('Added to your order!');
              router.back();
            }}
          >
            Add to Order • ${(
              (product.price + Array.from(selectedModifiers).reduce((sum, id) => {
                const group = product.modifierGroups?.find(g => g.modifiers.some(m => m.id === id));
                const mod = group?.modifiers.find(m => m.id === id);
                return sum + (mod?.priceDelta || 0);
              }, 0)) * quantity
            ).toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  );
}
