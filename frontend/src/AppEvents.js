import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PlantManager from './components/PlantManager'; // Admin-Plant
import OrderManager from './components/OrderManager'; // Order
import PlantsPage from './pages/PlantsPage';          // Customer
import CommunityEvents from './components/CommunityEvents'; // new import

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/plants" element={<PlantsPage />} />   {/* customer catalog */}
        <Route path="/admin/plants" element={<PlantManager />} /> {/* admin */}
        <Route path="/orders" element={<OrderManager />} />  
        
        {/* new Community Events route */}
        <Route path="/events" element={<CommunityEvents />} />
      </Routes>
    </Router>
  );
}

export default App;