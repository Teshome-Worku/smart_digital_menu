'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useCustomerSession } from '@/lib/customer-context';
import type { PublicRestaurantDto, PublicCategoryDto, PublicProductDto } from '@sdm/shared';

interface HomeData {
  restaurant: PublicRestaurantDto;
  categories: PublicCategoryDto[];
  featuredProducts: PublicProductDto[];
}

export default function CustomerHomePage() {
  const params = useParams();
  const restaurantSlug = params.restaurantSlug as string;
  const { session } = useCustomerSession();

  const [data, setData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await api.get<HomeData>(`/customer/${restaurantSlug}/home`);
        setData(response);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [restaurantSlug]);

  if (isLoading) {
    return (
      <div className="animate-pulse p-4 space-y-6">
        <div className="h-40 bg-surface-200 rounded-2xl w-full"></div>
        <div className="flex gap-4 overflow-hidden">
          <div className="h-24 w-24 bg-surface-200 rounded-xl shrink-0"></div>
          <div className="h-24 w-24 bg-surface-200 rounded-xl shrink-0"></div>
          <div className="h-24 w-24 bg-surface-200 rounded-xl shrink-0"></div>
        </div>
        <div className="space-y-4">
          <div className="h-6 w-32 bg-surface-200 rounded"></div>
          <div className="h-32 bg-surface-200 rounded-xl w-full"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-surface-500">
        Could not load restaurant data.
      </div>
    );
  }

  const { restaurant, categories, featuredProducts } = data;

  return (
    <div className="w-full">
      {/* Hero / Welcome */}
      <div className="relative bg-surface-900 text-white pb-8 pt-6 px-4 rounded-b-[2rem] shadow-sm">
        {restaurant.coverImageUrl && (
          <div className="absolute inset-0 overflow-hidden rounded-b-[2rem]">
            <img 
              src={restaurant.coverImageUrl} 
              alt={restaurant.name}
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-900 to-transparent"></div>
          </div>
        )}
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            {restaurant.logoUrl ? (
              <img src={restaurant.logoUrl} alt="Logo" className="w-12 h-12 rounded-full border-2 border-white/20 object-cover bg-white" />
            ) : (
              <div className="w-12 h-12 rounded-full border-2 border-white/20 bg-primary-600 flex items-center justify-center font-bold text-xl">
                {restaurant.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold leading-tight">{restaurant.name}</h1>
              {session ? (
                <p className="text-sm text-surface-300">Welcome to {session.tableName}</p>
              ) : (
                <p className="text-sm text-surface-300">Welcome, please take a seat!</p>
              )}
            </div>
          </div>

          {/* Quick Search fake input */}
          <Link href={`/m/${restaurantSlug}/menu`} className="block">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 text-surface-200 text-sm flex items-center gap-2">
              <span className="text-lg">🔍</span> What are you craving?
            </div>
          </Link>
        </div>
      </div>

      <div className="px-4 py-6 space-y-8">
        
        {/* Categories Carousel */}
        {categories.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-900">Categories</h2>
              <Link href={`/m/${restaurantSlug}/menu`} className="text-sm font-semibold text-primary-600">
                See all
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x hide-scrollbar">
              {categories.map((cat) => (
                <Link 
                  key={cat.id}
                  href={`/m/${restaurantSlug}/menu?category=${cat.id}`}
                  className="snap-start shrink-0 w-28 h-28 bg-white rounded-2xl shadow-sm border border-surface-100 flex flex-col items-center justify-center p-3 text-center active:scale-95 transition-transform"
                >
                  <div className="w-12 h-12 bg-surface-50 rounded-full mb-2 flex items-center justify-center text-2xl">
                    🍽️
                  </div>
                  <span className="text-xs font-semibold text-surface-700 line-clamp-1">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured Items */}
        {featuredProducts.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-surface-900 mb-4">Featured Highlights</h2>
            <div className="space-y-4">
              {featuredProducts.map((product) => (
                <Link 
                  key={product.id}
                  href={`/m/${restaurantSlug}/product/${product.id}`}
                  className="block bg-white rounded-2xl p-3 shadow-sm border border-surface-100 active:scale-[0.98] transition-transform"
                >
                  <div className="flex gap-4 h-28">
                    <div className="w-28 h-28 shrink-0 rounded-xl bg-surface-100 relative overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">🍲</div>
                      )}
                      <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        ⭐ Popular
                      </div>
                    </div>
                    <div className="flex flex-col flex-1 py-1 pr-1 min-w-0">
                      <h3 className="font-semibold text-surface-900 text-sm leading-tight line-clamp-2">{product.name}</h3>
                      <p className="text-xs text-surface-500 mt-1 line-clamp-2 flex-1">{product.description}</p>
                      <div className="font-bold text-primary-600">
                        {/* We should format currency properly, but generic for now */}
                        ${product.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
