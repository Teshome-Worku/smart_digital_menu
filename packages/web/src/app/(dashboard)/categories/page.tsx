'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import type { CategoryDto, CreateCategoryRequest } from '@sdm/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';

export default function CategoriesPage() {
  const { memberships } = useAuth();
  const { toast } = useToast();
  const currentRestaurant = memberships[0];

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentRestaurant) {
      loadCategories();
    }
  }, [currentRestaurant]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<CategoryDto[]>(`/restaurants/${currentRestaurant.restaurantId}/categories`);
      setCategories(data);
    } catch (err) {
      toast('Failed to load categories', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setIsEditing(null);
    setName('');
    setDescription('');
    setSortOrder(0);
  };

  const handleEdit = (category: CategoryDto) => {
    setIsEditing(category.id);
    setName(category.name);
    setDescription(category.description || '');
    setSortOrder(category.sortOrder);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const payload: CreateCategoryRequest = {
        name,
        description: description || undefined,
        sortOrder,
      };

      if (isEditing) {
        await api.put(`/restaurants/${currentRestaurant.restaurantId}/categories/${isEditing}`, payload);
        toast('Category updated', 'success');
      } else {
        await api.post(`/restaurants/${currentRestaurant.restaurantId}/categories`, payload);
        toast('Category created', 'success');
      }
      
      resetForm();
      await loadCategories();
    } catch (err) {
      toast('Failed to save category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? All products inside must be reassigned or deleted.')) return;
    
    try {
      await api.delete(`/restaurants/${currentRestaurant.restaurantId}/categories/${id}`);
      toast('Category deleted', 'success');
      await loadCategories();
    } catch (err) {
      toast('Failed to delete category', 'error');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap sortOrders
    const tempSort = newCategories[index].sortOrder;
    newCategories[index].sortOrder = newCategories[targetIndex].sortOrder;
    newCategories[targetIndex].sortOrder = tempSort;

    // Optimistic update
    setCategories(newCategories.sort((a, b) => a.sortOrder - b.sortOrder));

    try {
      await Promise.all([
        api.put(`/restaurants/${currentRestaurant.restaurantId}/categories/${newCategories[index].id}`, { sortOrder: newCategories[index].sortOrder }),
        api.put(`/restaurants/${currentRestaurant.restaurantId}/categories/${newCategories[targetIndex].id}`, { sortOrder: newCategories[targetIndex].sortOrder })
      ]);
    } catch (err) {
      toast('Failed to reorder categories', 'error');
      loadCategories(); // reload to reset state
    }
  };

  if (!currentRestaurant) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-dashboard-text">Categories</h1>
        <p className="text-dashboard-muted text-sm mt-1">
          Manage the sections of your menu (e.g., Starters, Mains, Drinks).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="md:col-span-1">
          <div className="bg-dashboard-card rounded-xl p-5 border border-dashboard-border sticky top-24">
            <h2 className="text-lg font-semibold text-dashboard-text mb-4">
              {isEditing ? 'Edit Category' : 'New Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Desserts"
                required
              />
              <div>
                <label className="block text-sm font-medium text-dashboard-text mb-1.5">Description (optional)</label>
                <textarea
                  className="w-full px-3 py-2.5 rounded-lg border border-surface-200 bg-white text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm resize-none"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A short description..."
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button type="submit" fullWidth isLoading={isSubmitting}>
                  {isEditing ? 'Save Changes' : 'Create Category'}
                </Button>
                {isEditing && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List Column */}
        <div className="md:col-span-2 space-y-3">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-dashboard-card rounded-xl border border-dashboard-border" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 bg-dashboard-card rounded-xl border border-dashboard-border border-dashed">
              <p className="text-dashboard-muted">No categories yet. Create your first one!</p>
            </div>
          ) : (
            categories.map((category, index) => (
              <div
                key={category.id}
                className={`bg-dashboard-card rounded-xl p-4 border transition-colors flex items-center gap-4 ${
                  isEditing === category.id ? 'border-primary-500 ring-1 ring-primary-500/20' : 'border-dashboard-border hover:border-dashboard-border/80'
                }`}
              >
                {/* Order controls */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-dashboard-muted hover:text-dashboard-text disabled:opacity-30 disabled:hover:text-dashboard-muted"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === categories.length - 1}
                    className="p-1 text-dashboard-muted hover:text-dashboard-text disabled:opacity-30 disabled:hover:text-dashboard-muted"
                  >
                    ▼
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-dashboard-text truncate">{category.name}</h3>
                    {!category.isActive && <Badge variant="default">Hidden</Badge>}
                  </div>
                  {category.description && (
                    <p className="text-sm text-dashboard-muted truncate mt-0.5">{category.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                    Edit
                  </Button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 text-dashboard-muted hover:text-danger hover:bg-danger-light/50 rounded-lg transition-colors"
                    title="Delete category"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
