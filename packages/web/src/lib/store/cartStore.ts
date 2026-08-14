import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItemModifier {
  modifierId: string;
  name: string;
  priceDelta: number;
}

export interface CartItem {
  id: string; // Unique ID for the cart line item
  productId: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
  modifiers: CartItemModifier[];
}

interface CartState {
  restaurantId: string | null;
  items: CartItem[];
  addItem: (restaurantId: string, item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      items: [],

      addItem: (restaurantId, item) => set((state) => {
        // If adding to a different restaurant, clear the cart first
        let newItems = state.items;
        if (state.restaurantId !== restaurantId) {
          newItems = [];
        }

        // Check if identical item (same product + same modifiers) already exists
        const existingItemIndex = newItems.findIndex(i => {
          if (i.productId !== item.productId) return false;
          if (i.modifiers.length !== item.modifiers.length) return false;
          // Check if all modifier IDs match
          const itemModIds = new Set(item.modifiers.map(m => m.modifierId));
          return i.modifiers.every(m => itemModIds.has(m.modifierId));
        });

        if (existingItemIndex >= 0) {
          // Increment quantity of existing
          const updatedItems = [...newItems];
          updatedItems[existingItemIndex].quantity += item.quantity;
          return { restaurantId, items: updatedItems };
        }

        // Add as new line item
        const newItem: CartItem = {
          ...item,
          id: crypto.randomUUID(), // Standard web API for generating UUIDs
        };

        return { restaurantId, items: [...newItems, newItem] };
      }),

      updateQuantity: (itemId, delta) => set((state) => {
        const updatedItems = state.items.map(item => {
          if (item.id === itemId) {
            const newQuantity = Math.max(1, item.quantity + delta);
            return { ...item, quantity: newQuantity };
          }
          return item;
        });
        return { items: updatedItems };
      }),

      removeItem: (itemId) => set((state) => ({
        items: state.items.filter(i => i.id !== itemId)
      })),

      clearCart: () => set({ restaurantId: null, items: [] }),

      getSubtotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const modsTotal = item.modifiers.reduce((sum, mod) => sum + mod.priceDelta, 0);
          return total + ((item.price + modsTotal) * item.quantity);
        }, 0);
      }
    }),
    {
      name: 'sdm-cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
