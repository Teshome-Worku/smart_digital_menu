'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import type { CategoryDto, ProductDto, CreateProductRequest } from '@sdm/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function ProductEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { memberships } = useAuth();
  const { toast } = useToast();
  
  const currentRestaurant = memberships[0];
  const productId = params.productId as string;
  const isNew = productId === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [tags, setTags] = useState<string>(''); // comma separated for now

  useEffect(() => {
    if (currentRestaurant) {
      loadData();
    }
  }, [currentRestaurant, productId]);

  const loadData = async () => {
    try {
      // Always load categories
      const cats = await api.get<CategoryDto[]>(`/restaurants/${currentRestaurant.restaurantId}/categories`);
      setCategories(cats);
      
      if (cats.length > 0 && isNew) {
        setCategoryId(cats[0].id);
      }

      // Load product if not new
      if (!isNew) {
        setIsLoading(true);
        const product = await api.get<ProductDto>(`/restaurants/${currentRestaurant.restaurantId}/products/${productId}`);
        
        setName(product.name);
        setDescription(product.description || '');
        setPrice(product.price.toString());
        setCategoryId(product.categoryId);
        setIsAvailable(product.isAvailable);
        setIsFeatured(product.isFeatured);
        if (product.tags) {
          setTags(product.tags.map(t => t.name).join(', '));
        }
      }
    } catch (err) {
      toast('Failed to load data', 'error');
      router.push('/dashboard/menu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryId) {
      toast('Please select a category', 'error');
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast('Please enter a valid price', 'error');
      return;
    }

    const tagArray = tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const payload: CreateProductRequest = {
      name,
      categoryId,
      price: parsedPrice,
      description: description || undefined,
      isAvailable,
      isFeatured,
      tags: tagArray.length > 0 ? tagArray : undefined,
    };

    try {
      setIsSubmitting(true);
      if (isNew) {
        await api.post(`/restaurants/${currentRestaurant.restaurantId}/products`, payload);
        toast('Product created successfully', 'success');
      } else {
        await api.put(`/restaurants/${currentRestaurant.restaurantId}/products/${productId}`, payload);
        toast('Product updated successfully', 'success');
      }
      router.push('/dashboard/menu');
    } catch (err) {
      toast('Failed to save product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !currentRestaurant) {
    return (
      <div className="animate-pulse space-y-6 max-w-3xl">
        <div className="h-8 bg-dashboard-card rounded w-1/3"></div>
        <div className="h-96 bg-dashboard-card rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/menu" 
          className="p-2 -ml-2 rounded-lg text-dashboard-muted hover:text-dashboard-text hover:bg-white/5 transition-colors"
        >
          ← Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-dashboard-text">
            {isNew ? 'Create Product' : 'Edit Product'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-6 space-y-5">
          <h2 className="text-lg font-semibold text-dashboard-text border-b border-dashboard-border pb-3 mb-4">
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Product Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Classic Cheeseburger"
              required
            />
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-dashboard-text">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-surface-200 bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
              >
                <option value="" disabled>Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Price ($)"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
            />
            
            <Input
              label="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. Spicy, Vegan, Gluten-Free"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dashboard-text mb-1.5">Description</label>
            <textarea
              className="w-full px-3 py-2.5 rounded-lg border border-surface-200 bg-white text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm resize-none"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the dish ingredients, preparation, etc..."
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-dashboard-text border-b border-dashboard-border pb-3 mb-4">
            Status & Visibility
          </h2>
          
          <label className="flex items-center justify-between p-4 rounded-lg border border-dashboard-border hover:bg-white/5 cursor-pointer transition-colors">
            <div>
              <p className="font-medium text-dashboard-text">Available for Order</p>
              <p className="text-sm text-dashboard-muted mt-0.5">Customers can see and order this item</p>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
              <div className="w-11 h-6 bg-surface-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 rounded-lg border border-dashboard-border hover:bg-white/5 cursor-pointer transition-colors">
            <div>
              <p className="font-medium text-dashboard-text">Featured Item</p>
              <p className="text-sm text-dashboard-muted mt-0.5">Highlight this item at the top of its category</p>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              <div className="w-11 h-6 bg-surface-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </div>
          </label>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link href="/dashboard/menu">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting}>
            {isNew ? 'Create Product' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
