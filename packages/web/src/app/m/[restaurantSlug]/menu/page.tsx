'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import type { PublicCategoryDto, PublicProductDto } from '@sdm/shared';

interface MenuData {
  categories: PublicCategoryDto[];
  products: PublicProductDto[];
}

export default function CustomerMenuPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const restaurantSlug = params.restaurantSlug as string;
  const initialCategory = searchParams.get('category');

  const [data, setData] = useState<MenuData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');

  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    async function loadData() {
      try {
        const response = await api.get<MenuData>(`/customer/${restaurantSlug}/menu`);
        setData(response);
        if (response.categories.length > 0 && !initialCategory) {
          setActiveCategory(response.categories[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [restaurantSlug, initialCategory]);

  useEffect(() => {
    // Scroll to category if passed in URL
    if (initialCategory && data && !isLoading) {
      const el = categoryRefs.current[initialCategory];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [initialCategory, data, isLoading]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-8 animate-pulse mt-4">
        <div className="h-10 bg-surface-200 rounded-xl w-full"></div>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-8 w-24 bg-surface-200 rounded-full"></div>)}
        </div>
        <div className="space-y-4">
          <div className="h-24 bg-surface-200 rounded-xl w-full"></div>
          <div className="h-24 bg-surface-200 rounded-xl w-full"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-center text-surface-500">Could not load menu.</div>;
  }

  const { categories, products } = data;

  // Filter products by search query
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const scrollToCategory = (id: string) => {
    setActiveCategory(id);
    const el = categoryRefs.current[id];
    if (el) {
      // Offset for sticky headers
      const y = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full flex flex-col h-full">
      {/* Sticky Header with Search and Categories */}
      <div className="sticky top-14 bg-surface-50 z-30 pt-4 pb-2 border-b border-surface-200 shadow-sm">
        <div className="px-4 mb-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">🔍</span>
            <input 
              type="text" 
              placeholder="Search menu..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-surface-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Category horizontal scroll */}
        {!searchQuery && (
          <div className="flex overflow-x-auto hide-scrollbar px-4 pb-1 gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  activeCategory === cat.id 
                    ? 'bg-primary-600 text-white shadow-sm' 
                    : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu List */}
      <div className="px-4 py-4 pb-8 space-y-8">
        {searchQuery ? (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-surface-500 uppercase tracking-wider mb-2">Search Results</h2>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-surface-500">No items found matching "{searchQuery}"</div>
            ) : (
              filteredProducts.map(product => <ProductCard key={product.id} product={product} slug={restaurantSlug} />)
            )}
          </div>
        ) : (
          categories.map(category => {
            const categoryProducts = products.filter(p => p.categoryId === category.id);
            if (categoryProducts.length === 0) return null;

            return (
              <section 
                key={category.id} 
                ref={(el) => { categoryRefs.current[category.id] = el; }}
                className="scroll-mt-32"
              >
                <h2 className="text-lg font-bold text-surface-900 mb-4">{category.name}</h2>
                <div className="space-y-4">
                  {categoryProducts.map(product => (
                    <ProductCard key={product.id} product={product} slug={restaurantSlug} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, slug }: { product: PublicProductDto; slug: string }) {
  return (
    <Link 
      href={`/m/${slug}/product/${product.id}`}
      className="block bg-white rounded-2xl p-3 shadow-sm border border-surface-100 active:scale-[0.98] transition-transform"
    >
      <div className="flex gap-4">
        <div className="flex flex-col flex-1 py-1 min-w-0">
          <h3 className="font-bold text-surface-900 text-[15px] leading-tight mb-1">{product.name}</h3>
          <p className="text-xs text-surface-500 line-clamp-2 flex-1 mb-2 leading-relaxed">{product.description}</p>
          <div className="flex items-center justify-between mt-auto">
            <div className="font-bold text-primary-600">
              ${product.price.toFixed(2)}
            </div>
            {product.tags.length > 0 && (
              <div className="flex gap-1">
                {product.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-[9px] font-bold uppercase tracking-wide bg-surface-100 text-surface-600 px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="w-24 h-24 shrink-0 rounded-xl bg-surface-100 relative overflow-hidden">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="96px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl opacity-50">🍽️</div>
          )}
        </div>
      </div>
    </Link>
  );
}
