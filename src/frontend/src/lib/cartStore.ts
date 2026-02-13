import { create } from 'zustand';
import type { Product } from '../backend';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartStore {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateQuantity: (productId: string, delta: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: [],
  
  addToCart: (product: Product) => {
    const { cart } = get();
    const existing = cart.find(item => item.product.id === product.id);
    
    if (existing) {
      set({
        cart: cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      set({ cart: [...cart, { product, quantity: 1 }] });
    }
  },
  
  updateQuantity: (productId: string, delta: number) => {
    const { cart } = get();
    set({
      cart: cart
        .map(item => {
          if (item.product.id === productId) {
            const newQuantity = item.quantity + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
          }
          return item;
        })
        .filter(item => item.quantity > 0),
    });
  },
  
  removeItem: (productId: string) => {
    const { cart } = get();
    set({ cart: cart.filter(item => item.product.id !== productId) });
  },
  
  clearCart: () => {
    set({ cart: [] });
  },
  
  getItemCount: () => {
    const { cart } = get();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
