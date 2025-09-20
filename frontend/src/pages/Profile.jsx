import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const Profile = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
  });
  const [loyaltyInfo, setLoyaltyInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/auth/profile', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        
        setFormData({
          name: response.data.name,
          email: response.data.email,
          address: response.data.address || '',
        });
        
        setLoyaltyInfo(response.data.loyaltyInfo);
        
      } catch (error) {
        alert('Failed to fetch profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProfile();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosInstance.put('/auth/profile', formData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      
      setLoyaltyInfo(response.data.loyaltyInfo);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const LoyaltyCard = ({ info }) => {
    const getTierColor = (tier) => {
      const colors = {
        'Green': 'bg-green-200 text-green-700',
        'Silver': 'bg-gray-300 text-gray-800',
        'Gold': 'bg-yellow-300 text-yellow-900',
        'Premium': 'bg-purple-300 text-purple-900'
      };
      return colors[tier] || colors['Green'];
    };

    return (
      <div className="bg-white p-6 shadow-md rounded mb-6">
        <h2 className="text-xl font-bold mb-4">Loyalty Status</h2>
        
        <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 ${getTierColor(info.currentTier)}`}>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">${info.totalSpent.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Spent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{info.totalOrders}</div>
            <div className="text-sm text-gray-600">Orders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{info.loyaltyPoints}</div>
            <div className="text-sm text-gray-600">Points</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{info.discount}%</div>
            <div className="text-sm text-gray-600">Discount</div>
          </div>
        </div>
        
        {info.nextTier && (
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress to {info.nextTier}</span>
              <span>${info.amountToNextTier.toFixed(2)} to go</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${info.progressToNext}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4">
      {loyaltyInfo && <LoyaltyCard info={loyaltyInfo} />}
      
      {/* profile form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded">
        <h1 className="text-2xl font-bold mb-4 text-center">Your Profile</h1>
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded">
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default Profile;