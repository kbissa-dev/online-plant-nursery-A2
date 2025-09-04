import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import React, { useState, useEffect } from 'react';
import { getCart, removeFromCart, clearCart, getCartCount } from '../services/cartService';


const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const loadCart = () => {
    const items = getCart();
    setCartItems(items);
    setCartCount(getCartCount());
  };

  const handleRemoveItem = (plantId) => {
    removeFromCart(plantId);
    loadCart();
  };

  const handleClearCart = () => {
    clearCart();
    loadCart();
  };

  useEffect(() => {
    loadCart();
  }, []);

  //cart will update without needing to refresh browser for the update to be displayed
  useEffect(() => {
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold">Online Plant Nursery System</Link>
      <div>
        {user ? (
          <>
            <Link to="/plants" className="mr-4">Plants</Link>
            <Link to="/orders" className="mr-4">Orders</Link>
            <Link to="/profile" className="mr-4">Profile</Link>

            {/* cart */}
            <div className="relative mr-4">
              <button
                onClick={() => setShowCart(!showCart)}
                className="bg-blue-500 px-3 py-2 rounded hover:bg-blue-700"
              >
                Cart ({cartCount})
              </button>
              
              {/* cart popup */}
              {showCart && (
                <div className="absolute right-0 top-12 bg-white text-black p-4 rounded shadow-lg w-80 max-h-96 overflow-y-auto z-50">
                  {cartItems.length === 0 ? (
                    <p>Cart is empty</p>
                  ) : (
                    <>
                      <h3 className="font-bold mb-2">Shopping Cart</h3>
                      {cartItems.map(item => (
                        <div key={item.plant._id} className="flex justify-between items-center mb-2 p-2 border-b">
                          <div>
                            <div className="font-semibold">{item.plant.name}</div>
                            <div className="text-sm">Qty: {item.quantity} × ${item.plant.price}</div>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2">${(item.plant.price * item.quantity).toFixed(2)}</span>
                            <button 
                              onClick={() => handleRemoveItem(item.plant._id)}
                              className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="mt-2 pt-2 border-t">
                        <div className="font-bold">Total: ${cartItems.reduce((sum, item) => sum + (item.plant.price * item.quantity), 0).toFixed(2)}</div>
                        <button 
                          onClick={handleClearCart}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm mt-2 hover:bg-red-700"
                        >
                          Clear Cart
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="mr-4">Login</Link>
            <Link
              to="/register"
              className="bg-green-500 px-4 py-2 rounded hover:bg-green-700"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
