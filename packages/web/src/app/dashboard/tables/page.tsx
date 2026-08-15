'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { TableDto, CreateTableRequest } from '@sdm/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';


export default function TablesPage() {
  const { memberships } = useAuth();
  const currentRestaurant = memberships[0];
  const { toast } = useToast();

  const [tables, setTables] = useState<TableDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableNumber, setNewTableNumber] = useState('');

  const fetchTables = async () => {
    if (!currentRestaurant) return;
    try {
      const response = await api.get<TableDto[]>(`/restaurants/${currentRestaurant.restaurantId}/tables`);
      setTables(response);
    } catch (err) {
      console.error(err);
      toast('Failed to load tables', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [currentRestaurant]);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant) return;

    try {
      setIsSubmitting(true);
      const payload: CreateTableRequest = {
        name: newTableName,
        number: parseInt(newTableNumber, 10),
      };

      await api.post(`/restaurants/${currentRestaurant.restaurantId}/tables`, payload);
      
      toast('Table added successfully', 'success');
      setIsAddOpen(false);
      setNewTableName('');
      setNewTableNumber('');
      fetchTables();
    } catch (err: any) {
      toast(err.message || 'Failed to add table', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (table: TableDto) => {
    if (!currentRestaurant) return;
    try {
      await api.patch(`/restaurants/${currentRestaurant.restaurantId}/tables/${table.id}`, {
        isActive: !table.isActive
      });
      toast(`Table marked as ${!table.isActive ? 'Active' : 'Inactive'}`, 'success');
      fetchTables();
    } catch (err: any) {
      toast(err.message || 'Failed to update table', 'error');
    }
  };

  const handleDelete = async (tableId: string) => {
    if (!currentRestaurant) return;
    if (!confirm('Are you sure you want to delete this table? This will invalidate its QR code.')) return;

    try {
      await api.delete(`/restaurants/${currentRestaurant.restaurantId}/tables/${tableId}`);
      toast('Table deleted', 'success');
      fetchTables();
    } catch (err: any) {
      toast(err.message || 'Failed to delete table', 'error');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-dashboard-muted animate-pulse">Loading tables...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-dashboard-text">Table Management</h1>
          <p className="text-dashboard-muted mt-1">Manage your restaurant's floor plan and physical tables.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>Add Table</Button>
      </div>

      <div className="bg-dashboard-card rounded-2xl border border-dashboard-border overflow-hidden">
        {tables.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">🪑</div>
            <h3 className="text-lg font-bold text-dashboard-text mb-2">No tables found</h3>
            <p className="text-dashboard-muted mb-6">Add your first table to start generating QR codes.</p>
            <Button onClick={() => setIsAddOpen(true)}>Add Table</Button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dashboard-border bg-dashboard-surface/30">
                <th className="p-4 font-bold text-dashboard-muted text-sm w-16">No.</th>
                <th className="p-4 font-bold text-dashboard-muted text-sm">Table Name</th>
                <th className="p-4 font-bold text-dashboard-muted text-sm">Status</th>
                <th className="p-4 font-bold text-dashboard-muted text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashboard-border">
              {tables.map(table => (
                <tr key={table.id} className="hover:bg-dashboard-surface/30 transition-colors">
                  <td className="p-4 font-bold text-dashboard-text">{table.number}</td>
                  <td className="p-4">
                    <span className="font-medium text-dashboard-text">{table.name}</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                      table.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {table.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button 
                      onClick={() => handleToggleStatus(table)}
                      className="text-sm font-medium text-dashboard-muted hover:text-dashboard-text transition-colors px-2 py-1"
                    >
                      {table.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button 
                      onClick={() => handleDelete(table.id)}
                      className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors px-2 py-1"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Table Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-dashboard-card w-full max-w-md rounded-2xl border border-dashboard-border shadow-xl p-6">
            <h2 className="text-xl font-bold text-dashboard-text mb-4">Add New Table</h2>
            <form onSubmit={handleAddTable} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-dashboard-text">Table Number</label>
                <Input 
                  type="number" 
                  min="1"
                  required 
                  value={newTableNumber} 
                  onChange={e => setNewTableNumber(e.target.value)} 
                  placeholder="e.g. 1" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-dashboard-text">Table Name / Label</label>
                <Input 
                  required 
                  value={newTableName} 
                  onChange={e => setNewTableName(e.target.value)} 
                  placeholder="e.g. Table 1, Window Seat" 
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Add Table</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
