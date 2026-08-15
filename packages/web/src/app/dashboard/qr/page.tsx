'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { TableDto } from '@sdm/shared';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/components/ui/toast';

export default function QRCodesPage() {
  const { memberships } = useAuth();
  const currentRestaurant = memberships[0];
  const { toast } = useToast();

  const [tables, setTables] = useState<TableDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // We fetch tables specifically for QR printing
  const fetchTables = async () => {
    if (!currentRestaurant) return;
    try {
      const response = await api.get<TableDto[]>(`/restaurants/${currentRestaurant.restaurantId}/tables`);
      // Only show active tables for QR generation
      setTables(response.filter(t => t.isActive));
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

  const handlePrint = () => {
    window.print();
  };

  // Determine the base URL for the QR code
  // Prefer NEXT_PUBLIC_APP_URL to guarantee it points to the correct place (like a local IP or prod domain),
  // fallback to window.location.origin if it's missing (though it shouldn't be).
  const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      // Remove trailing slash if present
      return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
    }
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'http://localhost:3000';
  };

  const baseUrl = getBaseUrl();
  const restaurantName = currentRestaurant?.restaurantName || 'Restaurant';
  const logoUrl = currentRestaurant?.restaurantLogoUrl;

  if (isLoading) {
    return <div className="p-8 text-dashboard-muted animate-pulse">Loading QR Codes...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* ─── Screen-Only Controls (hidden on print) ─── */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-dashboard-text">Print QR Codes</h1>
          <p className="text-dashboard-muted mt-1">Generate high-quality print-ready QR cards for your tables.</p>
        </div>
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <span>🖨️</span> Print All Cards
        </Button>
      </div>

      <div className="mb-6 print:hidden">
        <p className="text-sm text-dashboard-muted bg-dashboard-surface/50 p-4 rounded-xl border border-dashboard-border">
          <strong>Tip:</strong> For the best results, use your browser's print dialog (Ctrl+P or Cmd+P) and enable "Background Graphics". Set margins to "Minimum" or "None".
        </p>
      </div>

      {tables.length === 0 ? (
        <div className="p-12 text-center bg-dashboard-card rounded-2xl border border-dashboard-border print:hidden">
          <div className="text-4xl mb-4">🪑</div>
          <h3 className="text-lg font-bold text-dashboard-text mb-2">No active tables found</h3>
          <p className="text-dashboard-muted mb-6">You need to add active tables in the Table Management tab first.</p>
        </div>
      ) : (
        /* ─── Print Grid ─── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 print:grid-cols-2 print:gap-4 print:w-full">
          {tables.map(table => {
            const qrUrl = `${baseUrl}/qr/${table.qrToken}`;

            return (
              <div 
                key={table.id} 
                className="bg-white rounded-3xl border border-gray-200 shadow-md p-8 flex flex-col items-center text-center print:shadow-none print:border-2 print:border-gray-800 print:break-inside-avoid print:p-6"
              >
                {/* Brand Header */}
                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">{restaurantName}</h2>
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-6">
                  {table.name}
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-4 rounded-2xl border-4 border-gray-900 shadow-inner mb-6 relative">
                  <QRCodeSVG 
                    value={qrUrl}
                    size={200}
                    level="H" // High error correction to accommodate logo
                    imageSettings={logoUrl ? {
                      src: logoUrl,
                      x: undefined,
                      y: undefined,
                      height: 48,
                      width: 48,
                      excavate: true, // Digs out a white square in the middle for the logo
                    } : undefined}
                  />
                </div>

                {/* Instructions */}
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-gray-900">Scan to View Menu</span>
                  <span className="text-sm font-medium text-gray-500 mt-1">Order directly from your phone</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
