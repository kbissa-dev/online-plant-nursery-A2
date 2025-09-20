import { useState, useEffect } from 'react';
import api from '../axiosConfig';

const AdminPanel = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    employeeId: ''
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await api.get('/api/auth/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const createStaff = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/auth/staff', newStaff);
      setStaff([...staff, response.data]);
      setNewStaff({ name: '', email: '', password: '', role: 'staff', employeeId: '' });
      setShowCreateForm(false);
      alert('Staff account created successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create staff account');
    }
  };

  const toggleStaffStatus = async (staffId) => {
    try {
      const response = await api.put(`/api/auth/staff/${staffId}/toggle`);
      setStaff(staff.map(s => 
        s._id === staffId 
          ? { ...s, isActive: !s.isActive }
          : s
      ));
      alert(response.data.message);
    } catch (error) {
      alert('Failed to update staff status');
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      'admin': 'bg-red-500 text-white',
      'staff': 'bg-blue-500 text-white'
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[role]}`}>
        {role.toUpperCase()}
      </span>
    );
  };

  if (loading) return <div className="text-center mt-20">Loading staff...</div>;

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Create Staff Account
        </button>
      </div>

      {/* create staff form modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Create Staff Account</h3>
            <form onSubmit={createStaff}>
              <input
                type="text"
                placeholder="Full Name"
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                className="w-full mb-3 p-2 border rounded"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                className="w-full mb-3 p-2 border rounded"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={newStaff.password}
                onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                className="w-full mb-3 p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Employee ID"
                value={newStaff.employeeId}
                onChange={(e) => setNewStaff({ ...newStaff, employeeId: e.target.value })}
                className="w-full mb-3 p-2 border rounded"
              />
              <select
                value={newStaff.role}
                onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                className="w-full mb-4 p-2 border rounded"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* staff table */}
      <div className="bg-white shadow-md rounded overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Staff Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Employee ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff.map((member) => (
              <tr key={member._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{member.name}</div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRoleBadge(member.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {member.employeeId || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    member.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {member.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(member.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => toggleStaffStatus(member._id)}
                    className={`text-sm px-3 py-1 rounded ${
                      member.isActive
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {member.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {staff.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No staff members found. Create the first staff account!
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;