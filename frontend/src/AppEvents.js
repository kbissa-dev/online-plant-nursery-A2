import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PlantManager from './components/PlantManager'; 
import OrderManager from './components/OrderManager'; 
import PlantsPage from './pages/PlantsPage';         
import CommunityEvents from './components/CommunityEvents'; 

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
