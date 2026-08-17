import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeCartItem as apiRemoveCartItem,
  clearCartApi,
  mergeGuestCart,
  type CartItemDto,
} from '../api/cart';
import { getAccessToken } from '../api/auth';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface AddCartItemInput {
  id: string;
  name: string;
  price: number;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: AddCartItemInput) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isLoading: boolean;
}

const CART_STORAGE_KEY = 'cart-items';

const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadGuestCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapApiItemToCartItem(item: CartItemDto): CartItem {
  return {
    id: item.id,
    productId: item.productId,
    name: item.productName,
    price: item.price,
    quantity: item.quantity,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadGuestCart);
  const [isLoading, setIsLoading] = useState(false);
  const isAuthenticated = Boolean(getAccessToken());
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || hasSyncedRef.current) return;

    const syncGuestCart = async () => {
      setIsLoading(true);
      try {
        const guestItems = loadGuestCart();
        if (guestItems.length > 0) {
          const merged = await mergeGuestCart(
            guestItems.map((i) => ({
              productId: i.productId,
              productName: i.name,
              price: i.price,
              quantity: i.quantity,
            })),
          );
          setItems(merged.items.map(mapApiItemToCartItem));
          localStorage.removeItem(CART_STORAGE_KEY);
        } else {
          const cart = await fetchCart();
          setItems(cart.items.map(mapApiItemToCartItem));
        }
        hasSyncedRef.current = true;
      } catch {
        // Keep guest cart items if API fails
      } finally {
        setIsLoading(false);
      }
    };

    void syncGuestCart();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isAuthenticated]);

  const addItem = useCallback(
    async (item: AddCartItemInput) => {
      if (!isAuthenticated) {
        setItems((prev) => {
          const existing = prev.find((i) => i.productId === item.id);
          if (existing) {
            return prev.map((i) =>
              i.productId === item.id ? { ...i, quantity: i.quantity + 1 } : i,
            );
          }
          return [...prev, { id: item.id, productId: item.id, name: item.name, price: item.price, quantity: 1 }];
        });
        return;
      }

      try {
        const cart = await apiAddToCart({
          productId: item.id,
          productName: item.name,
          price: item.price,
          quantity: 1,
        });
        setItems(cart.items.map(mapApiItemToCartItem));
      } catch {
        // Silently fail - item not added
      }
    },
    [isAuthenticated],
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (!isAuthenticated) {
        setItems((prev) => prev.filter((i) => i.productId !== id));
        return;
      }

      try {
        const item = items.find((i) => i.productId === id);
        if (item) {
          const cart = await apiRemoveCartItem(item.id);
          setItems(cart.items.map(mapApiItemToCartItem));
        }
      } catch {
        // Silently fail
      }
    },
    [isAuthenticated, items],
  );

  const updateQuantity = useCallback(
    async (id: string, quantity: number) => {
      const clampedQty = Math.max(1, quantity);

      if (!isAuthenticated) {
        setItems((prev) =>
          prev.map((i) => (i.productId === id ? { ...i, quantity: clampedQty } : i)),
        );
        return;
      }

      try {
        const item = items.find((i) => i.productId === id);
        if (item) {
          const cart = await apiUpdateCartItem(item.id, clampedQty);
          setItems(cart.items.map(mapApiItemToCartItem));
        }
      } catch {
        // Silently fail
      }
    },
    [isAuthenticated, items],
  );

  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    try {
      await clearCartApi();
      setItems([]);
    } catch {
      // Silently fail
    }
  }, [isAuthenticated]);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalItems,
      totalPrice,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isLoading,
    }),
    [items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart, isLoading],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
