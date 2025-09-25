import React from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CartModal = () => {
  const { 
    cartItems, 
    isCartOpen, 
    closeCart, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    getTotalPrice,
    canAddMore 
  } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    closeCart();
    navigate('/orders');
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeCart();
    }
  };

  const handleQuantityIncrease = (item) => {
    if (canAddMore(item.plant)) {
      updateQuantity(item.plant._id, item.qty + 1);
    }
  };

  const handleQuantityDecrease = (item) => {
    updateQuantity(item.plant._id, item.qty - 1);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
      onClick={handleOverlayClick}
    >
      <div className="bg-white w-96 h-full shadow-lg overflow-y-auto">
        {/* header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Shopping Cart</h2>
          <button
            onClick={closeCart}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* cart items */}
        <div className="flex-1 p-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Your cart is empty</p>
              <button
                onClick={closeCart}
                className="mt-2 text-green-600 hover:text-green-700"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map(item => {
                const canIncrease = canAddMore(item.plant);
                const isAtStockLimit = item.qty >= item.plant.stock;
                
                return (
                  <div key={item.plant._id} className="border-b border-gray-100 pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm">{item.plant.name}</h3>
                      <button
                        onClick={() => removeFromCart(item.plant._id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      ${Number(item.plant.price).toFixed(2)} each
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuantityDecrease(item)}
                          className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.qty}</span>
                        <button
                          onClick={() => handleQuantityIncrease(item)}
                          disabled={!canIncrease}
                          className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={!canIncrease ? `Only ${item.plant.stock} in stock` : ''}
                        >
                          +
                        </button>
                      </div>
                      <div className="font-medium">
                        ${(Number(item.plant.price) * item.qty).toFixed(2)}
                      </div>
                    </div>
                    
                    {/* stock warnings */}
                    {Number(item.plant.stock) <= 5 && (
                      <div className="text-xs text-orange-600 mt-1">
                        Only {item.plant.stock} left in stock
                      </div>
                    )}
                    
                    {isAtStockLimit && (
                      <div className="text-xs text-red-600 mt-1">
                        Maximum quantity reached
                      </div>
                    )}
                    
                    {item.qty > item.plant.stock && (
                      <div className="text-xs text-red-600 mt-1 font-medium">
                        ⚠️ Exceeds available stock! Only {item.plant.stock} available
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* footer */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            {/* show stock warning if any items exceed stock */}
            {cartItems.some(item => item.qty > item.plant.stock) && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                ⚠️ Some items exceed available stock. Please adjust quantities before checkout.
              </div>
            )}
            
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">Total:</span>
              <span className="font-semibold text-lg">
                ${getTotalPrice().toFixed(2)}
              </span>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={handleCheckout}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={
                  !user || 
                  user.role !== 'customer' || 
                  cartItems.some(item => item.qty > item.plant.stock) // prevent checkout if stock exceeded
                }
              >
                {!user ? 'Login to Checkout' : 
                 user.role !== 'customer' ? 'Customer Access Only' : 
                 cartItems.some(item => item.qty > item.plant.stock) ? 'Adjust Quantities First' :
                 'Proceed to Checkout'}
              </button>
              
              <button
                onClick={clearCart}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;