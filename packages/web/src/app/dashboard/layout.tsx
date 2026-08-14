'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
  { label: 'Orders', href: '/orders', icon: OrdersIcon },
  { label: 'Menu', href: '/menu', icon: MenuIcon },
  { label: 'Categories', href: '/categories', icon: CategoriesIcon },
  { label: 'Tables', href: '/tables', icon: TablesIcon },
  { label: 'QR Codes', href: '/qr', icon: QRIcon },
  { label: 'Analytics', href: '/analytics', icon: AnalyticsIcon },
  { label: 'Settings', href: '/settings', icon: SettingsIcon },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, memberships, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dashboard-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center animate-pulse">
            <span className="text-xl">🍽️</span>
          </div>
          <p className="text-dashboard-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const currentRestaurant = memberships[0];

  return (
    <div className="min-h-screen bg-dashboard-bg flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-dashboard-surface border-r border-dashboard-border flex flex-col',
          'transform transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-dashboard-border">
          <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center shadow-glow">
            <span className="text-lg">🍽️</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-dashboard-text truncate">Smart Digital Menu</h2>
            <p className="text-xs text-dashboard-muted truncate">
              {currentRestaurant?.restaurantName || 'No restaurant'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary-500/10 text-primary-400'
                    : 'text-dashboard-muted hover:text-dashboard-text hover:bg-white/5',
                )}
              >
                <item.icon className="w-5 h-5" active={isActive} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-dashboard-border">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dashboard-text truncate">{user?.name}</p>
              <p className="text-xs text-dashboard-muted truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-dashboard-muted hover:text-danger hover:bg-white/5 transition-colors"
              title="Log out"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 flex items-center gap-4 px-6 border-b border-dashboard-border bg-dashboard-surface/50 backdrop-blur-sm sticky top-0 z-30">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-dashboard-muted hover:text-dashboard-text hover:bg-white/5 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1" />

          {/* Restaurant context */}
          {currentRestaurant && (
            <span className="text-xs text-dashboard-muted bg-white/5 px-3 py-1.5 rounded-full border border-dashboard-border">
              {currentRestaurant.role}
            </span>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="animate-[fade-in_0.3s_ease-out]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Icons ───────────────────────────────────────────────

function DashboardIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </svg>
  );
}

function OrdersIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
      <path d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function MenuIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
      <path d="M3 4h14M3 8h14M3 12h10M3 16h6" strokeLinecap="round" />
    </svg>
  );
}

function CategoriesIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
      <path d="M3 3h6v6H3zM11 3h6v4H11zM11 9h6v8H11zM3 11h6v6H3z" />
    </svg>
  );
}

function TablesIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
      <circle cx="10" cy="10" r="7" />
      <circle cx="10" cy="10" r="3" />
    </svg>
  );
}

function QRIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
      <rect x="3" y="3" width="5" height="5" rx="0.5" />
      <rect x="12" y="3" width="5" height="5" rx="0.5" />
      <rect x="3" y="12" width="5" height="5" rx="0.5" />
      <rect x="12" y="14" width="2" height="2" />
      <rect x="15" y="12" width="2" height="2" />
      <rect x="12" y="12" width="2" height="1" />
    </svg>
  );
}

function AnalyticsIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
      <path d="M3 17V9l4-4 3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 3h4v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
      <path d="M10 13a3 3 0 100-6 3 3 0 000 6z" />
      <path d="M17 10a7 7 0 01-.5 2.6l1.3 1.5-1.4 1.4-1.5-1.3A7 7 0 0110 17a7 7 0 01-4.9-2.8l-1.5 1.3-1.4-1.4 1.3-1.5A7 7 0 013 10a7 7 0 01.5-2.6L2.2 5.9l1.4-1.4 1.5 1.3A7 7 0 0110 3a7 7 0 014.9 2.8l1.5-1.3 1.4 1.4-1.3 1.5A7 7 0 0117 10z" />
    </svg>
  );
}
