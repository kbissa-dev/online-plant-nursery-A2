import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../axiosConfig';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    lowStock: [],
    pendingOrders: 0,
    processingOrders: 0,
    totalPlants: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [lowStockRes, ordersRes, plantsRes] = await Promise.all([
        api.get('/api/inventory/low-stock'),
        api.get('/api/orders'),
        api.get('/api/plants')
      ]);

      const orders = ordersRes.data;
      setStats({
        lowStock: lowStockRes.data,
        pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'paid').length,
        processingOrders: orders.filter(o => o.status === 'processing').length,
        totalPlants: plantsRes.data.length
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const LowStockAlert = ({ plants }) => {
    if (plants.length === 0) return null;

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-3">
          <span className="text-red-500 text-xl mr-2">⚠️</span>
          <h3 className="text-lg font-bold text-red-800">Low Stock Alert</h3>
        </div>
        <p className="text-red-700 mb-3">
          {plants.length} plant{plants.length > 1 ? 's' : ''} running low on stock:
        </p>
        <div className="space-y-2">
          {plants.map(plant => (
            <div key={plant._id} className="flex justify-between items-center bg-white p-2 rounded">
              <span className="font-medium">{plant.name}</span>
              <span className="text-red-600 font-bold">
                {plant.stock} left
              </span>
            </div>
          ))}
        </div>
        <Link 
          to="/staff/plants" 
          className="inline-block mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Manage Inventory
        </Link>
      </div>
    );
  };

  const StatCard = ({ title, value, color, link }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
      </div>
      {link && (
        <Link 
          to={link} 
          className="inline-block mt-3 text-sm text-blue-600 hover:underline"
        >
          View Details →
        </Link>
      )}
    </div>
  );

  if (loading) return <div className="text-center mt-20">Loading dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {user?.role === 'admin' ? 'Admin Dashboard' : 'Staff Dashboard'}
        </h1>
        <div className="text-sm text-gray-600">
          Welcome back, {user?.name}!
        </div>
      </div>

      <LowStockAlert plants={stats.lowStock} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          color="text-yellow-600"
          link="/staff/orders"
        />
        <StatCard
          title="Processing Orders"
          value={stats.processingOrders}
          color="text-blue-600"
          link="/staff/orders"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStock.length}
          color="text-red-600"
          link="/staff/plants"
        />
        <StatCard
          title="Total Plants"
          value={stats.totalPlants}
          color="text-green-600"
          link="/staff/plants"
        />
      </div>

      {/* quick actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/staff/plants"
            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg text-center transition-colors"
          >
            <div className="font-semibold">Manage Plants</div>
            <div className="text-sm opacity-90">Add, edit, or update inventory</div>
          </Link>
          
          <Link
            to="/staff/orders"
            className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg text-center transition-colors"
          >
            <div className="font-semibold">Process Orders</div>
            <div className="text-sm opacity-90">Update order status</div>
          </Link>
          
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg text-center transition-colors"
            >
              <div className="font-semibold">Manage Staff</div>
              <div className="text-sm opacity-90">Add or manage staff accounts</div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;