// backend/subscribers/inventoryAlerts.js
const { inventoryEvents } = require('../services/inventoryManager');

function registerInventorySubscribers() {
  inventoryEvents.on('low-stock', ({ plantId, name, stock, threshold }) => {
    console.log(`[ALERT] Low stock: ${name} (${plantId}) → ${stock} (≤ ${threshold})`);
  });
}

module.exports = { registerInventorySubscribers };
