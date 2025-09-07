// backend/seed/seedPlants.js
require('dotenv').config();
const mongoose = require('mongoose');

// ⬇️ Adjust this path only if your Plant model lives elsewhere
const Plant = require('../models/Plant');
const data = require('./auPlants.json');

(async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("Missing MONGO_URI in backend/.env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    const { acknowledged } = await Plant.deleteMany({});
    await Plant.insertMany(data);

    console.log(`✅ Seeded ${data.length} plants`);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
