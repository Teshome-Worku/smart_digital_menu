'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { OrderDto, OrderStatus } from '@sdm/shared';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function DashboardOrdersPage() {
  const { memberships } = useAuth();
  const currentRestaurant = memberships[0];
  const { toast } = useToast();

  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    if (!currentRestaurant) return;
    try {
      const response = await api.get<OrderDto[]>(`/restaurants/${currentRestaurant.restaurantId}/orders`);
      setOrders(response);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, [currentRestaurant]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      
      await api.patch(`/restaurants/${currentRestaurant.restaurantId}/orders/${orderId}/status`, { status });
      toast(`Order moved to ${status}`, 'success');
      
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        // remove from active board
        setTimeout(() => {
          setOrders(prev => prev.filter(o => o.id !== orderId));
        }, 1000);
      }
    } catch (err) {
      toast('Failed to update status', 'error');
      fetchOrders(); // Revert on failure
    }
  };

  if (isLoading && orders.length === 0) {
    return <div className="p-8 text-dashboard-muted">Loading orders...</div>;
  }

  // Filter orders by Kanban column
  const pending = orders.filter(o => o.status === 'PENDING' || o.status === 'ACCEPTED');
  const preparing = orders.filter(o => o.status === 'PREPARING');
  const ready = orders.filter(o => o.status === 'READY');

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dashboard-text">Live Orders</h1>
          <p className="text-dashboard-muted text-sm mt-1">Manage incoming orders from tables in real-time.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* Column 1: New Orders */}
        <OrderColumn 
          title="New Orders" 
          orders={pending} 
          colorClass="bg-blue-500/10 border-blue-500/20"
          titleColor="text-blue-400"
          actionLabel="Accept & Prepare"
          onAction={(id) => updateStatus(id, 'PREPARING')}
        />

        {/* Column 2: Preparing */}
        <OrderColumn 
          title="Preparing in Kitchen" 
          orders={preparing} 
          colorClass="bg-amber-500/10 border-amber-500/20"
          titleColor="text-amber-400"
          actionLabel="Mark Ready"
          onAction={(id) => updateStatus(id, 'READY')}
        />

        {/* Column 3: Ready */}
        <OrderColumn 
          title="Ready to Serve" 
          orders={ready} 
          colorClass="bg-green-500/10 border-green-500/20"
          titleColor="text-green-400"
          actionLabel="Complete"
          onAction={(id) => updateStatus(id, 'COMPLETED')}
        />
      </div>
    </div>
  );
}

function OrderColumn({ 
  title, 
  orders, 
  colorClass, 
  titleColor,
  actionLabel, 
  onAction 
}: { 
  title: string; 
  orders: OrderDto[]; 
  colorClass: string; 
  titleColor: string;
  actionLabel: string; 
  onAction: (id: string) => void; 
}) {
  return (
    <div className={`flex flex-col rounded-2xl border ${colorClass} overflow-hidden h-full`}>
      <div className="p-4 border-b border-dashboard-border/50 bg-dashboard-surface/30">
        <h3 className={`font-bold ${titleColor} flex justify-between items-center`}>
          {title}
          <span className="bg-dashboard-card text-dashboard-text px-2 py-0.5 rounded text-sm">
            {orders.length}
          </span>
        </h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4 hide-scrollbar">
        {orders.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-dashboard-muted text-sm border-2 border-dashed border-dashboard-border/30 rounded-xl">
            No orders
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-dashboard-card rounded-xl border border-dashboard-border p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-dashboard-muted/20"></div>
              
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xl font-bold text-dashboard-text">#{order.orderNumber}</div>
                  <div className="text-sm font-medium text-primary-400">{order.tableName}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-dashboard-muted">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs font-medium text-dashboard-muted mt-1">
                    Wait: {Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)}m
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {order.items.map(item => (
                  <div key={item.id} className="text-sm">
                    <div className="flex gap-2 text-dashboard-text">
                      <span className="font-bold text-dashboard-muted">{item.quantity}x</span>
                      <span className="font-medium">{item.productNameSnapshot}</span>
                    </div>
                    {item.modifiers.length > 0 && (
                      <div className="pl-6 text-xs text-dashboard-muted mt-0.5">
                        {item.modifiers.map(m => m.modifierNameSnapshot).join(', ')}
                      </div>
                    )}
                    {item.notes && (
                      <div className="pl-6 text-xs text-amber-500/80 italic mt-0.5">
                        Note: {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="mb-4 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
                  <span className="font-bold">Order Note:</span> {order.notes}
                </div>
              )}

              <div className="pt-3 border-t border-dashboard-border flex justify-between items-center">
                <div className="font-bold text-dashboard-text">${order.total.toFixed(2)}</div>
                <Button onClick={() => onAction(order.id)} size="sm" className="h-8 text-xs px-4">
                  {actionLabel}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
