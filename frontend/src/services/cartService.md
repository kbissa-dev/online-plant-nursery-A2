how to use cartService.js

//add this line to components (might not need to import all of them, so only include the ones needed):
import { addToCart, getCart, removeFromCart, getCartCount, updateQuantity, clearCart, getCartTotal } from '../services/cartService';

//after importing to components

//example when adding plant to cart:
addToCart(plantObject, 2);

//getting all cart items
const cartItems = getCart();

//removing items
removeFromCart(plantId);

//getting total items count for the navbar badge
const itemCount = getCartCount();

