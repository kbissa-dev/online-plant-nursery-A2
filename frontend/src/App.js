import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PlantManager from './components/PlantManager'; // Plant
import OrderManager from './components/OrderManager'; // Order

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/plants" element={<PlantManager />} />  
        <Route path="/orders" element={<OrderManager />} />  
      </Routes>
    </Router>
  );
}

export default App;
