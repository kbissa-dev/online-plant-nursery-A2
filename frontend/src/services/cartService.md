import api from '../axiosConfig';

const dispatchCartUpdate = () => {
  window.dispatchEvent(new CustomEvent('cartUpdated'));
};

export const addToCart = async (plantId, qty = 1) => {
  try {
    const response = await api.post('/cart', { plantId, qty });
    dispatchCartUpdate();
    return response.data;
  } catch (error) {
    console.error('Add to cart error:', error);
    throw error;
  }
};

export const getCart = async () => {
  try {
    const response = await api.get('/cart');
    return response.data;
  } catch (error) {
    console.error('Get cart error:', error);
    throw error;
  }
};

export const updateCartItem = async (plantId, qty) => {
  try {
    const response = await api.put('/cart/item', { plantId, qty });
    dispatchCartUpdate();
    return response.data;
  } catch (error) {
    console.error('Update cart item error:', error);
    throw error;
  }
};

export const removeFromCart = async (plantId) => {
  try {
    const response = await api.delete(`/cart/item/${plantId}`);
    dispatchCartUpdate();
    return response.data;
  } catch (error) {
    console.error('Remove from cart error:', error);
    throw error;
  }
};

export const clearCart = async () => {
  try {
    const response = await api.delete('/cart/clear');
    dispatchCartUpdate();
    return response.data;
  } catch (error) {
    console.error('Clear cart error:', error);
    throw error;
  }
};

export const getCartPricing = async () => {
  try {
    const response = await api.get('/cart/pricing');
    return response.data;
  } catch (error) {
    console.error('Get cart pricing error:', error);
    throw error;
  }
};

export const getCartCount = (cartData) => {
  if (!cartData || !cartData.items) return 0;
  return cartData.items.reduce((count, item) => count + item.qty, 0);
};

export const getCartTotal = (cartData) => {
  if (!cartData || !cartData.pricing) return '0.00';
  return cartData.pricing.total;
};