'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { CustomerProvider, useCustomerSession } from '@/lib/customer-context';

function BottomNav({ restaurantSlug }: { restaurantSlug: string }) {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Home', path: `/m/${restaurantSlug}/home`, icon: '🏠' },
    { name: 'Menu', path: `/m/${restaurantSlug}/menu`, icon: '📖' },
    { name: 'Cart', path: `/m/${restaurantSlug}/cart`, icon: '🛒' },
    { name: 'Profile', path: `/m/${restaurantSlug}/profile`, icon: '👤' },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-surface-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <Link 
              key={item.name} 
              href={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-primary-600' : 'text-surface-400 hover:text-surface-600'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function TopHeader({ restaurantSlug }: { restaurantSlug: string }) {
  const { session, isLoading } = useCustomerSession();

  return (
    <header className="sticky top-0 w-full bg-white/80 backdrop-blur-md border-b border-surface-200 z-40 h-14 flex items-center justify-between px-4 max-w-md mx-auto">
      <div className="font-bold text-surface-900 truncate">
        {/* We will fetch restaurant name in pages, but layout just uses the slug for now or leaves it generic */}
        Smart Menu
      </div>
      <div>
        {isLoading ? (
          <div className="w-16 h-6 bg-surface-200 rounded animate-pulse" />
        ) : session ? (
          <div className="text-sm font-semibold bg-surface-100 text-surface-800 px-3 py-1 rounded-full border border-surface-200">
            {session.tableName}
          </div>
        ) : (
          <div className="text-sm font-medium text-surface-500 bg-surface-100 px-3 py-1 rounded-full">
            No Table
          </div>
        )}
      </div>
    </header>
  );
}

function MobileLayoutContent({ children, restaurantSlug }: { children: ReactNode, restaurantSlug: string }) {
  return (
    <div className="min-h-screen bg-surface-50">
      <TopHeader restaurantSlug={restaurantSlug} />
      
      <main className="pb-24 max-w-md mx-auto">
        {children}
      </main>

      <BottomNav restaurantSlug={restaurantSlug} />
    </div>
  );
}

export default function CustomerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const params = useParams();
  const restaurantSlug = params.restaurantSlug as string;

  return (
    <CustomerProvider>
      <MobileLayoutContent restaurantSlug={restaurantSlug}>
        {children}
      </MobileLayoutContent>
    </CustomerProvider>
  );
}
