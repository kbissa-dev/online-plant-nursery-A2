import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PlantManager from './components/PlantManager'; // Admin--Plant
import OrderManager from './components/OrderManager'; // Admin--Order
import PlantsPage   from './pages/PlantsPage';  // customer list


function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Customer-facing Plants page */}
        <Route path="/" element={<PlantsPage />} />
        
        {/*Other pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />

        {/* Admin tools */}
        <Route path="/plants" element={<PlantManager />} />  
        <Route path="/orders" element={<OrderManager />} />  
      </Routes>
    </Router>
  );
}

export default App;
