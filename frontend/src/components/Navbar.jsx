import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 inset-x-0 z-50 bg-emerald-600 text-white">
      <Link to="/" className="text-2xl font-bold">Online Plant Nursery System</Link>
      <div className="max-w-[1100px] mx-auto p-4 flex justify-between items-center">
        {user ? (
          <>
            <Link to="/plants" className="mr-4">Plants</Link>  {/* Customer Catalog */}
            <Link to="/admin/plants" className="mr-4">Admin</Link>
            <Link to="/orders" className="mr-4">Orders</Link>
            <Link to="/profile" className="mr-4">Profile</Link>
            <button
              onClick={handleLogout}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="mr-4">Login</Link>
            <Link
              to="/register"
              className="mr-4"
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
