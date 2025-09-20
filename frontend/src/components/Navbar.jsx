import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoyaltyBadge from './LoyaltyBadge';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavigationItems = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'admin':
        return (
          <>
            <Link to="/staff/plants" className="hover:text-emerald-200">Plants</Link>
            <Link to="/staff/orders" className="hover:text-emerald-200">Orders</Link>
            <Link to="/admin" className="hover:text-emerald-200">Admin Dashboard</Link>
            <Link to="/profile" className="hover:text-emerald-200">Profile</Link>
          </>
        );
        
      case 'staff':
        return (
          <>
            <Link to="/staff/plants" className="hover:text-emerald-200">Plants</Link>
            <Link to="/staff/orders" className="hover:text-emerald-200">Orders</Link>
            <Link to="/profile" className="hover:text-emerald-200">Profile</Link>
          </>
        );
        
      case 'customer':
      default:
        return (
          <>
            <Link to="/plants" className="hover:text-emerald-200">Plants</Link>
            <Link to="/orders" className="hover:text-emerald-200">My Orders</Link>
            <Link to="/profile" className="hover:text-emerald-200">Profile</Link>
          </>
        );
    }
  };

  const getRoleBadge = () => {
    if (!user) return null;
    
    const roleColors = {
      'admin': 'bg-red-500 text-white',
      'staff': 'bg-blue-500 text-white',
      'customer': 'bg-green-500 text-white'
    };
      
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${roleColors[user.role]}`}>
        {user.role.toUpperCase()}
      </span>
    );
  };

  return (
    <nav className="sticky top-0 inset-x-0 z-50 bg-emerald-600 text-white">
      <div className="max-w-[1200px] mx-auto p-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">GREEN Online Plant Nursery</Link>
        
        {user ? (
          <div className="flex items-center space-x-4">
            {getRoleBadge()}
            
            {user.role === 'customer' && (
              <LoyaltyBadge loyaltyTier={user.loyaltyTier} size="xs" />
            )}
            
            {/* role based navigation */}
            <div className="flex items-center space-x-4">
              {getNavigationItems()}
            </div>
            
            {/* welcome user info and logout */}
            <div className="flex items-center space-x-3">
              <span className="text-sm">Hi, {user.name}</span>
              <button
                onClick={handleLogout}
                className="bg-emerald-700 hover:bg-emerald-800 px-3 py-1 rounded transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="flex space-x-4">
            <Link to="/login" className="hover:text-emerald-200">Login</Link>
            <Link
              to="/register"
              className="bg-emerald-700 hover:bg-emerald-800 px-3 py-1 rounded transition-colors"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
