// backend/controllers/inventoryController.js
const { InventoryManager } = require('../services/inventoryManager');
const Plant = require('../models/Plant');
const Order = require('../models/Order');

const manager = new InventoryManager({
  PlantModel: Plant,
  OrderModel: Order,
  lowStockThreshold: 5,
});

// ---- Stock ops ----
exports.adjustStock = async (req, res) => {
  try {
    const { delta } = req.body; // { "delta": -2 }
    const doc = await manager.adjustStock(req.params.id, delta);
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.checkStock = async (req, res) => {
  try {
    res.json({ stock: await manager.checkStock(req.params.id) });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

exports.listLowStock = async (_req, res) => {
  try {
    res.json(await manager.listLowStock());
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ---- Orders (with stock reduction) ----
exports.applyOrder = async (req, res) => {
  try {
    const payload = {
      userId: req.user?.id,
      items: req.body.items,
      deliveryFee: req.body.deliveryFee,
      shipping: req.body.shipping,
    };
    const order = await manager.applyOrder(payload);
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
