import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Product } from '@workspace/api-client-react';

export type CartItem = Product & {
  quantity: number;
  selectedDuration: string;
  selectedPrice: number;
};

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, selectedDuration: string, selectedPrice: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function migrateCartItems(raw: unknown[]): CartItem[] {
  return raw.map((item: any) => ({
    ...item,
    selectedDuration: item.selectedDuration ?? item.duration ?? '',
    selectedPrice: item.selectedPrice ?? item.salePrice ?? item.price ?? 0,
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('keytopia_cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? migrateCartItems(parsed) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('keytopia_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, selectedDuration: string, selectedPrice: number) => {
    setItems((current) => {
      const existing = current.find(item => item.id === product.id);
      if (existing) {
        return current.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, selectedDuration, selectedPrice }
            : item
        );
      }
      return [...current, { ...product, quantity: 1, selectedDuration, selectedPrice }];
    });
  };

  const removeItem = (productId: number) => {
    setItems(current => current.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(current =>
      current.map(item => item.id === productId ? { ...item, quantity } : item)
    );
  };

  const clearCart = () => setItems([]);

  const cartTotal = items.reduce((sum, item) => sum + (item.selectedPrice * item.quantity), 0);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
