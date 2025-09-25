const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health probe for VM and Nginx
app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

//Existing routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/plants', require('./routes/plantRoutes')); // Plants CRUD
app.use('/api/orders', require('./routes/orderRoutes')); // Orders CRUD

// InventoryManager routes
app.use('/api/inventory', require('./routes/inventoryRoutes'));

//app.use('/api/cart', require('./routes/cartRoutes'));

// Basic error handling
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

// Start only when run directly
if (require.main === module) {
    connectDB().then(()=> {
      // Register subscribers AFTER DB is ready
      const { registerInventorySubscribers } = require('./subscribers/inventoryAlerts');
      registerInventorySubscribers();
      // If the file is run directly, start the server
      const PORT = process.env.PORT || 5001;
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    });
  }

module.exports = app
