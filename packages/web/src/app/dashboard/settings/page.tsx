'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import type { RestaurantSummary } from '@sdm/shared';

const CURRENCIES = [
  { code: 'ETB', name: 'Ethiopian Birr' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
];

export default function SettingsPage() {
  const { user, memberships } = useAuth();
  const { toast } = useToast();
  const membership = memberships[0];
  const [restaurant, setRestaurant] = useState<RestaurantSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    currency: 'USD',
    timezone: 'UTC',
    logoUrl: '',
    coverImageUrl: '',
  });

  useEffect(() => {
    async function loadSettings() {
      if (!membership) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get<{ restaurant: RestaurantSummary }>(
          `/restaurants/${membership.restaurantId}`,
        );
        const current = response.restaurant;
        setRestaurant(current);
        setForm({
          name: current.name,
          slug: current.slug,
          description: current.description || '',
          currency: current.currency,
          timezone: current.timezone,
          logoUrl: current.logoUrl || '',
          coverImageUrl: current.coverImageUrl || '',
        });
      } catch (error) {
        toast(error instanceof ApiError ? error.message : 'Could not load restaurant settings.', 'error');
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [membership, toast]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!membership || !restaurant) return;

    try {
      setIsSaving(true);
      const response = await api.put<{ restaurant: RestaurantSummary }>(
        `/restaurants/${membership.restaurantId}`,
        {
          ...form,
          logoUrl: form.logoUrl || null,
          coverImageUrl: form.coverImageUrl || null,
        },
      );
      setRestaurant(response.restaurant);
      setForm({
        name: response.restaurant.name,
        slug: response.restaurant.slug,
        description: response.restaurant.description || '',
        currency: response.restaurant.currency,
        timezone: response.restaurant.timezone,
        logoUrl: response.restaurant.logoUrl || '',
        coverImageUrl: response.restaurant.coverImageUrl || '',
      });
      toast('Restaurant settings saved.', 'success');
    } catch (error) {
      toast(error instanceof ApiError ? error.message : 'Could not save restaurant settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-dashboard-muted animate-pulse">Loading settings...</div>;
  }

  if (!membership) {
    return (
      <div className="rounded-2xl border border-primary-500/20 bg-primary-500/10 p-8">
        <h1 className="text-xl font-bold text-dashboard-text">Create your restaurant first</h1>
        <p className="mt-2 text-dashboard-muted">Restaurant settings will appear after your restaurant is created.</p>
      </div>
    );
  }

  const isOwner = membership.role === 'OWNER';

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-2">
      <div>
        <h1 className="text-3xl font-bold text-dashboard-text">Restaurant Settings</h1>
        <p className="mt-1 text-dashboard-muted">Manage your restaurant profile, currency, and account preferences.</p>
      </div>

      <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-dashboard-text">Restaurant profile</h2>
          <p className="mt-1 text-sm text-dashboard-muted">These details are used in the customer menu and dashboard.</p>
        </div>

        {!isOwner && (
          <div className="mb-5 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            Only the restaurant owner can change these settings.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Restaurant name" value={form.name} onChange={(event) => updateField('name', event.target.value)} disabled={!isOwner} required />
            <Input label="Public URL slug" value={form.slug} onChange={(event) => updateField('slug', event.target.value)} disabled={!isOwner} required />
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-dashboard-text">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              disabled={!isOwner}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-dashboard-border bg-dashboard-surface px-3 py-2 text-sm text-dashboard-text outline-none focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-dashboard-text">Currency</span>
              <select
                value={form.currency}
                onChange={(event) => updateField('currency', event.target.value)}
                disabled={!isOwner}
                className="w-full rounded-lg border border-dashboard-border bg-dashboard-surface px-3 py-2.5 text-sm text-dashboard-text outline-none focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>{currency.code} — {currency.name}</option>
                ))}
              </select>
              <span className="mt-1.5 block text-xs text-dashboard-muted">Chapa online payments require ETB.</span>
            </label>
            <Input label="Timezone" value={form.timezone} onChange={(event) => updateField('timezone', event.target.value)} disabled={!isOwner} required />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Logo URL (optional)" type="url" value={form.logoUrl} onChange={(event) => updateField('logoUrl', event.target.value)} disabled={!isOwner} />
            <Input label="Cover image URL (optional)" type="url" value={form.coverImageUrl} onChange={(event) => updateField('coverImageUrl', event.target.value)} disabled={!isOwner} />
          </div>
          {isOwner && <Button type="submit" isLoading={isSaving}>Save restaurant settings</Button>}
        </form>
      </section>

      <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-6">
        <h2 className="text-xl font-semibold text-dashboard-text">Your profile</h2>
        <p className="mt-1 text-sm text-dashboard-muted">Account details and security controls.</p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-dashboard-muted">Name</p>
            <p className="mt-1 text-dashboard-text">{user?.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-dashboard-muted">Email</p>
            <p className="mt-1 text-dashboard-text">{user?.email}</p>
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-dashboard-border bg-dashboard-surface/50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-dashboard-text">Multi-factor authentication</h3>
              <p className="mt-1 text-sm text-dashboard-muted">Add an authenticator app or security key to protect your account.</p>
            </div>
            <span className="shrink-0 rounded-full bg-dashboard-border px-3 py-1 text-xs text-dashboard-muted">Planned</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-6">
        <h2 className="text-xl font-semibold text-dashboard-text">Workspace access</h2>
        <p className="mt-1 text-sm text-dashboard-muted">Your current role for this restaurant.</p>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-dashboard-border bg-dashboard-surface/50 p-4">
          <span className="text-dashboard-text">{restaurant?.name}</span>
          <span className="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-400">{membership.role}</span>
        </div>
      </section>
    </div>
  );
}
