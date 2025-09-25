import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoyaltyBadge from './LoyaltyBadge';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getTotalItems, openCart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

return (
    <nav className="bg-green-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* logo/brand */}
          <Link to="/" className="text-xl font-bold hover:text-green-200">
            GREEN - Online Plant Nursery
          </Link>

          {/* navigation links */}
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                {/* customer navigation */}
                {user.role === 'customer' && (
                  <>
                    <Link to="/plants" className="hover:text-green-200">
                      Plants
                    </Link>
                    <Link to="/orders" className="hover:text-green-200">
                      My Orders
                    </Link>
                    <Link to="/profile" className="hover:text-green-200">
                      Profile
                    </Link>
                    
                    {/* cart indicator */}
                    <button
                      onClick={openCart}
                      className="relative hover:text-green-200 flex items-center"
                    >
                      <span>Cart</span>
                      {getTotalItems() > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {getTotalItems()}
                        </span>
                      )}
                    </button>
                  </>
                )}

                {/* staff/admin Navigation */}
                {(user.role === 'staff' || user.role === 'admin') && (
                  <>
                    <Link to="/staff" className="hover:text-green-200">
                      Dashboard
                    </Link>
                    <Link to="/staff/plants" className="hover:text-green-200">
                      Manage Plants
                    </Link>
                    <Link to="/staff/orders" className="hover:text-green-200">
                      Manage Orders
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="hover:text-green-200">
                        Admin Panel
                      </Link>
                    )}
                  </>
                )}

                {/* user info and logout */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">
                      Welcome, {user.name}
                    </span>
                    {/* show loyalty badge for customers */}
                    {user.role === 'customer' && user.loyaltyTier && user.loyaltyTier !== 'none' && (
                      <LoyaltyBadge loyaltyTier={user.loyaltyTier} size="xs" />
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-green-700 hover:bg-green-800 px-3 py-1 rounded text-sm"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              /* Guest Navigation */
              <>
                <Link 
                  to="/login" 
                  className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="border border-green-400 hover:bg-green-700 px-4 py-2 rounded"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;