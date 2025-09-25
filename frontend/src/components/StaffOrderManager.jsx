import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../axiosConfig';

const StaffOrderManager = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      // sort by newest order first as it is usually always more relevant than older orders
      setOrders(response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus, notes = '') => {
    try {
      setUpdatingOrderId(orderId);
      
      const updateData = { 
        status: newStatus,
        processedBy: user.id,
        notes 
      };
      
      if (newStatus === 'shipped') {
        updateData.shippedBy = user.id;
      }

      await api.put(`/orders/${orderId}`, updateData);
      
      setOrders(orders.map(order => 
        order._id === orderId 
          ? { ...order, status: newStatus, processedBy: user.id }
          : order
      ));
      
      alert(`Order ${newStatus} successfully!`);
    } catch (error) {
      alert('Failed to update order status');
      console.error(error);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800', 
      'processing': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || colors['pending'];
  };

  const getAvailableActions = (order) => {
    const actions = [];
    
    switch (order.status) {
      case 'pending':
      case 'paid':
        actions.push({ status: 'processing', label: 'Start Processing', color: 'blue' });
        actions.push({ status: 'cancelled', label: 'Cancel', color: 'red' });
        break;
      case 'processing':
        actions.push({ status: 'shipped', label: 'Mark as Shipped', color: 'purple' });
        actions.push({ status: 'cancelled', label: 'Cancel', color: 'red' });
        break;
      case 'shipped':
        actions.push({ status: 'delivered', label: 'Mark as Delivered', color: 'gray' });
        break;
      default:
        console.warn(`No actions available for order status: ${order.status}`);
        break;
    }
    
    return actions;
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <div className="text-center mt-20">Loading orders...</div>;

  return (
    <div className="max-w-7xl mx-auto mt-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <div className="text-sm text-gray-600">
          Total: {orders.length} orders
        </div>
      </div>

      {/* filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Orders', count: orders.length },
            { key: 'pending', label: 'Pending', count: statusCounts.pending || 0 },
            { key: 'paid', label: 'Paid', count: statusCounts.paid || 0 },
            { key: 'processing', label: 'Processing', count: statusCounts.processing || 0 },
            { key: 'shipped', label: 'Shipped', count: statusCounts.shipped || 0 },
            { key: 'delivered', label: 'Delivered', count: statusCounts.delivered || 0 }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* order table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map(order => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order._id.slice(-6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.createdBy?.name || 'Guest'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-48">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="truncate">
                          {item.name} × {item.qty}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {getAvailableActions(order).map(action => (
                      <button
                        key={action.status}
                        onClick={() => updateOrderStatus(order._id, action.status)}
                        disabled={updatingOrderId === order._id}
                        className={`px-3 py-1 text-xs rounded font-medium transition-colors
                          ${action.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
                          ${action.color === 'purple' ? 'bg-purple-500 hover:bg-purple-600 text-white' : ''}
                          ${action.color === 'gray' ? 'bg-gray-500 hover:bg-gray-600 text-white' : ''}
                          ${action.color === 'red' ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      >
                        {updatingOrderId === order._id ? 'Updating...' : action.label}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No orders found for the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffOrderManager;