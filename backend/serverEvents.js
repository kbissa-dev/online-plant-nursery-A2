// backend/serverWithEvents.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health probe
app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Existing routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/plants', require('./routes/plantRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));

// NEW: Event routes
app.use('/api/events', require('./routes/eventRoutes'));

// Error handling
app.use((req, res) => res.status(404).json({ message: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

// Run this server
if (require.main === module) {
  connectDB().then(() => {
    const { registerInventorySubscribers } = require('./subscribers/inventoryAlerts');
    registerInventorySubscribers();

    const PORT = process.env.PORT || 5002; 
    app.listen(PORT, () => console.log(`Event server running on port ${PORT}`));
  });
}

module.exports = app;
