const dispatchCartUpdate = () => {
  window.dispatchEvent(new CustomEvent('cartUpdated'));
};

export const addToCart = (plant, quantity) => {
    const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');

    const existingItemIndex = cart.findIndex(item => item.plant._id === plant.id);

    if (existingItemIndex >= 0) {
        cart[existingItemIndex].quantity += quantity;
    } else {
        cart.push({ plant, quantity });
    }

    sessionStorage.setItem('cart', JSON.stringify(cart));
    dispatchCartUpdate();
    return cart;
};

export const removeFromCart = (plantId) => {
    const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
    const updatedCart = cart.filter(item => item.plant._id !== plantId);
    sessionStorage.setItem('cart', JSON.stringify(updatedCart));
    dispatchCartUpdate();
    return updatedCart;  
};

export const updateQuantity = (plantId, newQuantity) => {
    if (newQuantity <= 0) {
        return removeFromCart(plantId);
    }

    const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
    const itemIndex = cart.findIndex(item => item.plant._id === plantId);

    if (itemIndex >= 0) {
        cart[itemIndex].quantity = newQuantity;
        sessionStorage.setItem('cart', JSON.stringify(cart));
        dispatchCartUpdate();
    }

    return cart;
};

export const getCart = () => {
    return JSON.parse(sessionStorage.getItem('cart') || '[]')
};

export const clearCart = () => {
    sessionStorage.removeItem('cart');
    dispatchCartUpdate();
    return [];
};



export const getCartTotal = () => {
    const cart = getCart();
    //the reduce method executes a "reducer" callback function, iterates through the array element
    return cart.reduce((total, item) => total + (item.plant.price * item.quantity), 0);
};

export const getCartCount = () => {
    const cart = getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
};