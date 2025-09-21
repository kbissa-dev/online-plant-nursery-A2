import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (userData) => {
    if (userData.token) {
      localStorage.setItem('authToken', userData.token);
    }

    setUser({
      ...userData,
      role: userData.role || 'customer',
      loyaltyTier: userData.loyaltyTier || (userData.role === 'customer' ? 'none' : null),
      loyaltyInfo: userData.loyaltyInfo || null,
      employeeId: userData.employeeId || null,
      isActive: userData.isActive !== undefined ? userData.isActive : true
    });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const updateLoyaltyInfo = (loyaltyInfo) => {
    if (user && user.role === 'customer') {
      setUser({
        ...user,
        loyaltyInfo
      });
    }
  };

  const userHelpers = {
    isCustomer: () => user?.role === 'customer',
    isStaff: () => user?.role === 'staff',
    isAdmin: () => user?.role === 'admin',
    canManagePlants: () => user?.role === 'staff' || user?.role === 'admin',
    canManageUsers: () => user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout,
      updateLoyaltyInfo,
      ...userHelpers
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
