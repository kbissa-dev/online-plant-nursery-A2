import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PlantManager from './components/PlantManager'; // staff plant crud management
import StaffOrderManager from './components/StaffOrderManager'; // staff order management
import StaffDashboard from './components/StaffDashboard';
import AdminDashboard from './components/AdminDashboard';
import PlantsPage from './pages/PlantsPage';          // customer plant catalog
import OrderManager from './components/OrderManager'; // customer orders


const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="text-center mt-20 text-red-600">Access Denied.</div>;
  }

  return children;
};

const RoleRedirect = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'admin':
    case 'staff':
      return <Navigate to="/staff/plants" replace />;
    case 'customer':
    default:
      return <Navigate to="/plants" replace />;
  }
};

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Navbar />
      <main className="app-main">
        {/* simple centered container */}
        {/* <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}></main>*/}
        <Routes>
          {/*default and public routes*/}
          <Route path="/" element={user ? <RoleRedirect /> : <Navigate to="/login" />} />
          <Route path="/login" element={!user ? <Login /> : <RoleRedirect />} />
          <Route path="/register" element={!user ? <Register /> : <RoleRedirect />} />   

          {/* customers routes */}
          {/* customer catalog */}
          <Route path="/plants" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <PlantsPage />
            </ProtectedRoute>
          } />

          {/* customer orders */}
          <Route path="/orders" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <OrderManager />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          {/* staff/admin routes */}
          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffDashboard />
            </ProtectedRoute>
          } />
          {/* staff plant crud management */}
          <Route path="/staff/plants" element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <PlantManager />
            </ProtectedRoute>
          } />
          {/* staff order management */}
          <Route path="/staff/orders" element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffOrderManager />
            </ProtectedRoute>
          } />

          {/* admin only routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* or redirect based on role */}
          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
