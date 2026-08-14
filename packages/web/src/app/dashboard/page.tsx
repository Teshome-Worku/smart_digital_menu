'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { user, memberships } = useAuth();
  const router = useRouter();
  const currentRestaurant = memberships[0];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-dashboard-text">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-dashboard-muted text-sm mt-1">
          Here&apos;s what&apos;s happening with your restaurant today.
        </p>
      </div>

      {/* Restaurant Setup CTA (if no restaurant) */}
      {!currentRestaurant ? (
        <div className="bg-gradient-to-r from-primary-500/10 to-primary-600/5 rounded-2xl p-8 border border-primary-500/20">
          <div className="max-w-lg">
            <h2 className="text-xl font-bold text-dashboard-text mb-2">
              Create your restaurant
            </h2>
            <p className="text-dashboard-muted text-sm mb-6">
              Set up your restaurant profile to start managing your digital menu,
              tables, and orders.
            </p>
            <Button
              onClick={() => router.push('/dashboard/settings')}
              size="lg"
            >
              Create Restaurant
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Orders', value: '—', change: 'Coming soon', icon: '📋' },
              { label: 'Revenue', value: '—', change: 'Coming soon', icon: '💰' },
              { label: 'Menu Views', value: '—', change: 'Coming soon', icon: '👁️' },
              { label: 'Active Items', value: '—', change: 'Coming soon', icon: '🍽️' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-dashboard-card rounded-xl p-5 border border-dashboard-border hover:border-primary-500/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <Badge variant="default">{stat.change}</Badge>
                </div>
                <p className="text-2xl font-bold text-dashboard-text">{stat.value}</p>
                <p className="text-sm text-dashboard-muted mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-dashboard-text mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Manage Menu', desc: 'Add or edit products', href: '/dashboard/menu', icon: '📝' },
                { label: 'View Orders', desc: 'Check incoming orders', href: '/dashboard/orders', icon: '📦' },
                { label: 'Manage Tables', desc: 'Set up tables & QR codes', href: '/dashboard/tables', icon: '🪑' },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className="flex items-center gap-4 bg-dashboard-card rounded-xl p-4 border border-dashboard-border hover:border-primary-500/30 hover:bg-dashboard-card/80 transition-all text-left group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-dashboard-text">{action.label}</p>
                    <p className="text-xs text-dashboard-muted">{action.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Restaurant Info */}
          <div className="bg-dashboard-card rounded-xl p-5 border border-dashboard-border">
            <h3 className="text-sm font-semibold text-dashboard-text mb-3">Restaurant Info</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-dashboard-muted">Name</span>
                <p className="text-dashboard-text font-medium">{currentRestaurant.restaurantName}</p>
              </div>
              <div>
                <span className="text-dashboard-muted">Role</span>
                <p className="text-dashboard-text font-medium">{currentRestaurant.role}</p>
              </div>
              <div>
                <span className="text-dashboard-muted">Slug</span>
                <p className="text-dashboard-text font-medium">{currentRestaurant.restaurantSlug}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
