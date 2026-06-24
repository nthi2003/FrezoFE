import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleDrawer: (open?: boolean) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  isOpen: false,
  
  addItem: (item) => set((state) => {
    const existingIndex = state.items.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      const newItems = [...state.items];
      newItems[existingIndex].quantity += (item.quantity || 1);
      return { items: newItems, isOpen: true }; // Mở giỏ hàng khi thêm thành công
    }
    return { items: [...state.items, { ...item, quantity: item.quantity || 1 }], isOpen: true };
  }),

  removeItem: (id) => set((state) => ({
    items: state.items.filter(i => i.id !== id)
  })),

  updateQuantity: (id, quantity) => set((state) => {
    if (quantity <= 0) return { items: state.items.filter(i => i.id !== id) };
    return {
      items: state.items.map(i => i.id === id ? { ...i, quantity } : i)
    };
  }),

  toggleDrawer: (open) => set((state) => ({ 
    isOpen: open !== undefined ? open : !state.isOpen 
  })),

  clearCart: () => set({ items: [] })
}));
