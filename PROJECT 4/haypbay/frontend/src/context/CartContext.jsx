import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext();

const getInitialCart = () => {
  try {
    const saved = localStorage.getItem("cartItems");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(getInitialCart);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  // ✅ SIMPLE WORKING ADD
  const addToCart = (product) => {
    if (!product?._id) return;

    setCartItems((prev) => {
      const existing = prev.find((item) => item._id === product._id);

      if (existing) {
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          _id: product._id,
          productId: product._id, // ✅ important for backend
          name: product.name,
          image: product.image,
          price: Number(product.price),
          qty: 1,
          size: product.size || "",
        },
      ];
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item._id !== id));
  };

  const increaseQty = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  const decreaseQty = (id) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item._id === id ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const clearCart = () => setCartItems([]);

  // ✅ COUNT (navbar fix)
  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.qty, 0);
  }, [cartItems]);

  const cartSubtotal = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
  }, [cartItems]);

  const gst = cartSubtotal * 0.05;
  const platformFee = 20;
  const deliveryFee = cartSubtotal > 999 ? 0 : 40;
  const cartTotal = cartSubtotal + gst + platformFee + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        increaseQty,
        decreaseQty,
        clearCart,
        cartCount, // ✅ IMPORTANT
        cartSubtotal,
        gst,
        platformFee,
        deliveryFee,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);