import { useEffect, useMemo, useState } from "react";
import { CartContext } from "./cartState";

const CART_STORAGE_KEY = "shoulder-slack-cart";

const readCart = () => {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo(() => ({
    items,
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    addToCart(product, size = null, quantity = 1) {
      const key = `${product.id}-${size || ""}`;
      setItems((currentItems) => {
        const existingItem = currentItems.find((item) => item.key === key);
        if (existingItem) {
          return currentItems.map((item) => item.key === key
            ? { ...item, quantity: item.quantity + quantity }
            : item);
        }
        return [...currentItems, { key, product, size, quantity }];
      });
    },
    updateQuantity(key, quantity) {
      setItems((currentItems) => currentItems.map((item) => item.key === key
        ? { ...item, quantity }
        : item));
    },
    removeFromCart(key) {
      setItems((currentItems) => currentItems.filter((item) => item.key !== key));
    },
    clearCart() {
      setItems([]);
    },
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
