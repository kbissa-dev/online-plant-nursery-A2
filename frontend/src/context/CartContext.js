import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('nurseryCart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }, []);

  // save cart to localStorage whenever it changes
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
      
      // check if adding this quantity would exceed stock
      if (existingItem) {
        const newQuantity = existingItem.qty + quantity;
        if (newQuantity > plant.stock) {
          console.warn(`Cannot add ${quantity} more ${plant.name}. Would exceed stock limit of ${plant.stock}`);
          return prevItems; // Return unchanged cart
        }
        
        // update quantity if within stock limit
        return prevItems.map(item =>
          item.plant._id === plant._id
            ? { ...item, qty: newQuantity }
            : item
        );
      } else {
        // check if initial quantity exceeds stock
        if (quantity > plant.stock) {
          console.warn(`Cannot add ${quantity} ${plant.name}. Only ${plant.stock} in stock`);
          return prevItems; // return unchanged cart
        }
        
        // add new item to cart
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
          // check stock limit when updating quantity
          if (newQuantity > item.plant.stock) {
            console.warn(`Cannot set quantity to ${newQuantity}. Only ${item.plant.stock} ${item.plant.name} in stock`);
            return item; // return unchanged item
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
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.qty, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => 
      total + (item.plant.price * item.qty), 0
    );
  };

  // get current quantity of a specific plant in cart
  const getCartQuantity = (plantId) => {
    const item = cartItems.find(item => item.plant._id === plantId);
    return item ? item.qty : 0;
  };

  // check if we can add more of a specific plant
  const canAddMore = (plant, additionalQty = 1) => {
    const currentQty = getCartQuantity(plant._id);
    return (currentQty + additionalQty) <= plant.stock;
  };

  // considering what's already in cart to give update on available stock
  const getAvailableStock = (plant) => {
    const inCart = getCartQuantity(plant._id);
    return Math.max(0, plant.stock - inCart);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
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
      closeCart
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