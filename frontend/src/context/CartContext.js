import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../axiosConfig';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [cartTotals, setCartTotals] = useState({
    subtotal: "0.00",
    discounts: [],
    totalDiscount: "0.00",
    total: "0.00",
    deliveryFee: "0.00"
  });
  const [calculationLoading, setCalculationLoading] = useState(false);
  const [calculationError, setCalculationError] = useState(null);

  const calculateTotals = useCallback(async (items, deliveryFee = 0) => {
    if (items.length === 0) {
      setCartTotals({
        subtotal: "0.00",
        discounts: [],
        totalDiscount: "0.00",
        total: deliveryFee.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2)
      });
      setCalculationError(null);
      return;
    }

    setCalculationLoading(true);
    setCalculationError(null);

    try {
      const payload = {
        items: items.map(item => ({
          plantId: item.plant._id,
          qty: item.qty
        })),
        deliveryFee: deliveryFee
      };

      const response = await api.post('/cart/calculate-totals', payload);
      setCartTotals(response.data);
    } catch (error) {
      console.error('Cart calculation failed:', error);
      const errorMessage = error.response?.data?.message || 'Failed to calculate cart totals';
      setCalculationError(errorMessage);
      
      // fallback to basic calculation on error
      const basicSubtotal = items.reduce((total, item) => 
        total + (item.plant.price * item.qty), 0
      );
      setCartTotals({
        subtotal: basicSubtotal.toFixed(2),
        discounts: [],
        totalDiscount: "0.00",
        total: (basicSubtotal + deliveryFee).toFixed(2),
        deliveryFee: deliveryFee.toFixed(2)
      });
    } finally {
      setCalculationLoading(false);
    }
  }, []);

  // load cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('nurseryCart');
      if (savedCart) {
        const items = JSON.parse(savedCart);
        setCartItems(items);
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }, []);

  // save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nurseryCart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cartItems]);

  const addToCart = (plant, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.plant._id === plant._id);
      
      if (existingItem) {
        const newQuantity = existingItem.qty + quantity;
        if (newQuantity > plant.stock) {
          console.warn(`Cannot add ${quantity} more ${plant.name}. Would exceed stock limit of ${plant.stock}`);
          return prevItems;
        }
        
        return prevItems.map(item =>
          item.plant._id === plant._id
            ? { ...item, qty: newQuantity }
            : item
        );
      } else {
        if (quantity > plant.stock) {
          console.warn(`Cannot add ${quantity} ${plant.name}. Only ${plant.stock} in stock`);
          return prevItems;
        }
        
        return [...prevItems, { plant, qty: quantity }];
      }
    });
  };

  const updateQuantity = (plantId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(plantId);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.plant._id === plantId) {
          if (newQuantity > item.plant.stock) {
            console.warn(`Cannot set quantity to ${newQuantity}. Only ${item.plant.stock} ${item.plant.name} in stock`);
            return item;
          }
          return { ...item, qty: newQuantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (plantId) => {
    setCartItems(prevItems =>
      prevItems.filter(item => item.plant._id !== plantId)
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setCartTotals({
      subtotal: "0.00",
      discounts: [],
      totalDiscount: "0.00",
      total: "0.00",
      deliveryFee: "0.00"
    });
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.qty, 0);
  };

  const getTotalPrice = () => {
    return parseFloat(cartTotals.total);
  };

  const getCartQuantity = (plantId) => {
    const item = cartItems.find(item => item.plant._id === plantId);
    return item ? item.qty : 0;
  };

  const canAddMore = (plant, additionalQty = 1) => {
    const currentQty = getCartQuantity(plant._id);
    return (currentQty + additionalQty) <= plant.stock;
  };

  const getAvailableStock = (plant) => {
    const inCart = getCartQuantity(plant._id);
    return Math.max(0, plant.stock - inCart);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // for external components to trigger calculation with delivery fee
  const calculateWithDelivery = useCallback((deliveryFee) => {
    calculateTotals(cartItems, deliveryFee);
  }, [cartItems, calculateTotals]);

  // calculate when cart items change
  useEffect(() => {
    if (cartItems.length > 0) {
      const timer = setTimeout(() => {
        calculateTotals(cartItems, 0);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // reset totals for empty cart
      setCartTotals({
        subtotal: "0.00",
        discounts: [],
        totalDiscount: "0.00",
        total: "0.00",
        deliveryFee: "0.00"
      });
    }
  }, [cartItems, calculateTotals]);

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
      cartTotals,
      calculationLoading,
      calculationError,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getTotalItems,
      getTotalPrice,
      getCartQuantity,
      canAddMore,
      getAvailableStock,
      openCart,
      closeCart,
      calculateWithDelivery
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};