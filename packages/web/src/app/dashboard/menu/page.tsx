'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import type { ProductDto, CategoryDto } from '@sdm/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

export default function MenuPage() {
  const { memberships } = useAuth();
  const { toast } = useToast();
  const currentRestaurant = memberships[0];

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (currentRestaurant) {
      loadData();
    }
  }, [currentRestaurant, selectedCategory]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        api.get<ProductDto[]>(`/restaurants/${currentRestaurant.restaurantId}/products${selectedCategory ? `?categoryId=${selectedCategory}` : ''}`),
        api.get<CategoryDto[]>(`/restaurants/${currentRestaurant.restaurantId}/categories`)
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      toast('Failed to load menu data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAvailability = async (product: ProductDto) => {
    try {
      // Optimistic update
      setProducts(products.map(p => p.id === product.id ? { ...p, isAvailable: !p.isAvailable } : p));
      
      await api.patch(`/restaurants/${currentRestaurant.restaurantId}/products/${product.id}/availability`, {
        isAvailable: !product.isAvailable
      });
      toast(`Marked as ${!product.isAvailable ? 'Available' : 'Unavailable'}`, 'success');
    } catch (err) {
      toast('Failed to update availability', 'error');
      // Revert on error
      setProducts(products.map(p => p.id === product.id ? { ...p, isAvailable: product.isAvailable } : p));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await api.delete(`/restaurants/${currentRestaurant.restaurantId}/products/${id}`);
      toast('Product deleted', 'success');
      loadData();
    } catch (err) {
      toast('Failed to delete product', 'error');
    }
  };

  if (!currentRestaurant) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dashboard-text">Menu Items</h1>
          <p className="text-dashboard-muted text-sm mt-1">
            Manage your dishes, prices, and availability.
          </p>
        </div>
        <Link href="/dashboard/menu/new">
          <Button>+ Add Product</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === null 
              ? 'bg-primary-500 text-white' 
              : 'bg-dashboard-card border border-dashboard-border text-dashboard-muted hover:text-dashboard-text'
          }`}
        >
          All Items
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-primary-500 text-white' 
                : 'bg-dashboard-card border border-dashboard-border text-dashboard-muted hover:text-dashboard-text'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-dashboard-card rounded-xl border border-dashboard-border animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-dashboard-card rounded-xl border border-dashboard-border border-dashed">
          <span className="text-4xl mb-4 block">🍽️</span>
          <h3 className="text-lg font-semibold text-dashboard-text mb-1">No products found</h3>
          <p className="text-dashboard-muted mb-6">Get started by creating your first menu item.</p>
          <Link href="/dashboard/menu/new">
            <Button>Create Product</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((product) => {
            const category = categories.find(c => c.id === product.categoryId);
            
            return (
              <div key={product.id} className="bg-dashboard-card rounded-xl border border-dashboard-border overflow-hidden flex flex-col group">
                {/* Image Placeholder */}
                <div className="h-32 bg-dashboard-surface relative">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-dashboard-muted bg-surface-100 dark:bg-surface-800">
                      <span>No image</span>
                    </div>
                  )}
                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/dashboard/menu/${product.id}`} className="p-2 bg-white/90 backdrop-blur text-surface-900 hover:text-primary-600 rounded-lg shadow-sm">
                      ✏️
                    </Link>
                    <button onClick={() => handleDelete(product.id)} className="p-2 bg-white/90 backdrop-blur text-danger hover:bg-danger-light rounded-lg shadow-sm">
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-semibold text-dashboard-text leading-tight">{product.name}</h3>
                    <span className="font-bold text-primary-500 whitespace-nowrap">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-dashboard-muted line-clamp-2 mb-3 flex-1">
                    {product.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-dashboard-border">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-dashboard-muted bg-dashboard-surface px-2 py-1 rounded-md border border-dashboard-border">
                        {category?.name || 'Uncategorized'}
                      </span>
                      {product.isFeatured && (
                        <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">
                          ★ Featured
                        </span>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => toggleAvailability(product)}
                      className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${
                        product.isAvailable 
                          ? 'text-success bg-success/10 hover:bg-success/20' 
                          : 'text-dashboard-muted bg-dashboard-surface border border-dashboard-border hover:bg-white/5'
                      }`}
                    >
                      {product.isAvailable ? 'Available' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
