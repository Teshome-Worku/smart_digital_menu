'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { CategoryDto, ProductDto } from '@sdm/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { ImageUpload } from '@/components/ui/image-upload';

export default function MenuManagementPage() {
  const { memberships } = useAuth();
  const currentRestaurant = memberships[0];
  const { toast } = useToast();

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Form states
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImage, setCatImage] = useState('');

  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (!currentRestaurant) return;
    try {
      setIsLoading(true);
      const [cats, prods] = await Promise.all([
        api.get<CategoryDto[]>(`/restaurants/${currentRestaurant.restaurantId}/categories`),
        api.get<ProductDto[]>(`/restaurants/${currentRestaurant.restaurantId}/products`),
      ]);
      setCategories(cats);
      setProducts(prods);
      if (cats.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(cats[0].id);
      }
    } catch (err) {
      console.error(err);
      toast('Failed to load menu data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRestaurant]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant) return;
    setIsSubmitting(true);
    try {
      const newCat = await api.post<CategoryDto>(`/restaurants/${currentRestaurant.restaurantId}/categories`, {
        name: catName,
        description: catDesc,
        imageUrl: catImage || undefined,
      });
      setCategories([...categories, newCat]);
      if (!selectedCategoryId) setSelectedCategoryId(newCat.id);
      setIsCategoryModalOpen(false);
      toast('Category created successfully', 'success');
      // reset form
      setCatName('');
      setCatDesc('');
      setCatImage('');
    } catch (err) {
      console.error(err);
      toast('Failed to create category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant) return;
    setIsSubmitting(true);
    try {
      const newProd = await api.post<ProductDto>(`/restaurants/${currentRestaurant.restaurantId}/products`, {
        name: prodName,
        description: prodDesc,
        price: parseFloat(prodPrice),
        categoryId: prodCategory,
        imageUrl: prodImage || undefined,
      });
      setProducts([...products, newProd]);
      setIsProductModalOpen(false);
      toast('Product created successfully', 'success');
      // reset form
      setProdName('');
      setProdDesc('');
      setProdPrice('');
      setProdImage('');
    } catch (err) {
      console.error(err);
      toast('Failed to create product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    if (!currentRestaurant) return;
    try {
      await api.delete(`/restaurants/${currentRestaurant.restaurantId}/products/${productId}`);
      setProducts(products.filter(p => p.id !== productId));
      toast('Product deleted', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to delete product', 'error');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-dashboard-muted animate-pulse">Loading Menu...</div>;
  }

  const activeProducts = products.filter(p => !selectedCategoryId || p.categoryId === selectedCategoryId);

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-dashboard-text">Menu Management</h1>
          <p className="text-dashboard-muted mt-1">Manage your categories and products.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-dashboard-surface rounded-xl p-1 border border-dashboard-border">
            <button 
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-700' : 'text-dashboard-muted hover:text-dashboard-text'}`}
            >
              Grid View
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-700' : 'text-dashboard-muted hover:text-dashboard-text'}`}
            >
              List View
            </button>
          </div>
          <Button onClick={() => setIsProductModalOpen(true)}>+ Add Product</Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* ─── Sidebar: Categories ─── */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-dashboard-text">Categories</h2>
            <button onClick={() => setIsCategoryModalOpen(true)} className="text-primary-600 hover:text-primary-700 font-bold text-sm bg-primary-50 px-2 py-1 rounded-lg">
              + New
            </button>
          </div>
          
          {categories.length === 0 ? (
            <p className="text-sm text-dashboard-muted p-4 bg-dashboard-surface rounded-xl border border-dashboard-border">No categories yet. Create one to get started!</p>
          ) : (
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
                    selectedCategoryId === cat.id 
                      ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500' 
                      : 'text-dashboard-text hover:bg-dashboard-surface border-l-4 border-transparent'
                  }`}
                >
                  {cat.name}
                  <span className="ml-2 text-xs text-dashboard-muted font-normal bg-dashboard-surface px-2 py-0.5 rounded-full">
                    {products.filter(p => p.categoryId === cat.id).length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Main Content: Products ─── */}
        <div className="flex-1">
          {categories.length === 0 ? (
            <div className="p-12 text-center bg-dashboard-card rounded-2xl border border-dashboard-border">
              <div className="text-4xl mb-4">🍽️</div>
              <h3 className="text-lg font-bold text-dashboard-text mb-2">Build Your Menu</h3>
              <p className="text-dashboard-muted mb-6">Start by creating a category on the left, then add your delicious products!</p>
            </div>
          ) : activeProducts.length === 0 ? (
            <div className="p-12 text-center bg-dashboard-surface/50 rounded-2xl border border-dashboard-border border-dashed">
              <div className="text-4xl mb-4">🍔</div>
              <h3 className="text-lg font-bold text-dashboard-text mb-2">No products in this category</h3>
              <p className="text-dashboard-muted mb-6">Add some products to see them here.</p>
              <Button onClick={() => { setProdCategory(selectedCategoryId || ''); setIsProductModalOpen(true); }}>
                Add First Product
              </Button>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeProducts.map(product => (
                    <div key={product.id} className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                      {/* Image Area */}
                      <div className="h-48 bg-surface-100 relative">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-surface-400 text-4xl bg-surface-50">
                            🍽️
                          </div>
                        )}
                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 bg-white rounded-full shadow-sm text-surface-600 hover:text-primary-600 transition-colors">✏️</button>
                          <button onClick={() => deleteProduct(product.id)} className="p-2 bg-white rounded-full shadow-sm text-surface-600 hover:text-danger transition-colors">🗑️</button>
                        </div>
                      </div>
                      
                      {/* Content Area */}
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-surface-900 line-clamp-1" title={product.name}>{product.name}</h3>
                          <span className="font-black text-primary-700 bg-primary-50 px-2 py-1 rounded-lg text-sm">${product.price.toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-surface-500 line-clamp-2 mb-4 h-10">
                          {product.description || 'No description provided.'}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${product.isAvailable ? 'bg-success' : 'bg-surface-300'}`}></span>
                          <span className="text-xs font-medium text-surface-600">{product.isAvailable ? 'Available' : 'Unavailable'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* LIST VIEW */
                <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface-50 border-b border-surface-200 text-surface-500 uppercase text-xs font-bold">
                      <tr>
                        <th className="px-6 py-4">Product</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {activeProducts.map(product => (
                        <tr key={product.id} className="hover:bg-surface-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-surface-100 flex-shrink-0 overflow-hidden border border-surface-200">
                                {product.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-surface-900">{product.name}</p>
                                <p className="text-xs text-surface-500 line-clamp-1 max-w-[200px]">{product.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-surface-900">
                            ${product.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.isAvailable ? 'bg-success-light text-success-dark' : 'bg-surface-200 text-surface-700'}`}>
                              {product.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-2 text-surface-400 hover:text-primary-600 transition-colors">✏️</button>
                              <button onClick={() => deleteProduct(product.id)} className="p-2 text-surface-400 hover:text-danger transition-colors">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── Modals ─── */}

      {/* Add Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 border border-surface-100">
            <h2 className="text-2xl font-bold text-surface-900 mb-6">Create Category</h2>
            <form onSubmit={handleCreateCategory} className="space-y-5">
              <Input label="Name" required value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Starters" />
              <Input label="Description (Optional)" value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="e.g. Delicious appetizers to begin your meal" />
              <div className="flex justify-end gap-3 mt-8">
                <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Create Category</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-surface-100 my-8">
            <h2 className="text-2xl font-bold text-surface-900 mb-6">Add New Product</h2>
            
            <form onSubmit={handleCreateProduct} className="space-y-8">
              
              {/* Image Uploader */}
              <div>
                <label className="block text-sm font-semibold text-surface-900 mb-2">Product Image (Optional)</label>
                <ImageUpload 
                  currentImageUrl={prodImage}
                  onUploadSuccess={(url) => setProdImage(url)} 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input label="Product Name" required value={prodName} onChange={e => setProdName(e.target.value)} placeholder="e.g. Truffle Burger" />
                <Input label="Price" required type="number" step="0.01" min="0" value={prodPrice} onChange={e => setProdPrice(e.target.value)} placeholder="e.g. 14.99" />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-surface-900">Category</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-surface-900"
                  required
                  value={prodCategory}
                  onChange={e => setProdCategory(e.target.value)}
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <Input label="Description" value={prodDesc} onChange={e => setProdDesc(e.target.value)} placeholder="Briefly describe this dish..." />

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
                <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="lg" isLoading={isSubmitting}>Save Product</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
