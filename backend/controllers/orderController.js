const mongoose = require('mongoose');
const Order = require('../models/Order');
const Plant = require('../models/Plant');

const badId = (id) => !mongoose.Types.ObjectId.isValid(id);

// GET /api/orders
const getOrders = async (req, res) => {
  try {
    const query = req.user?.id ? { /* createdBy: req.user.id */ } : {};
    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/orders
// body: { items: [{ plant: "<plantId>", qty: 2 }], deliveryFee?: number }
const addOrder = async (req, res) => {
  try {
    const { items = [], deliveryFee = 0 } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items is required (non-empty array)' });
    }

    // fetch plants and build snapshot items
    const plantIds = items.map(i => i.plant);
    const plants = await Plant.find({ _id: { $in: plantIds } }).lean();
    const byId = Object.fromEntries(plants.map(p => [String(p._id), p]));

    const snapItems = items.map(i => {
      const p = byId[i.plant];
      if (!p) throw new Error('One or more plants not found');
      if (i.qty <= 0) throw new Error('qty must be >= 1');
      return { plant: p._id, name: p.name, price: p.price, qty: i.qty };
    });

    const subtotal = snapItems.reduce((s, i) => s + i.price * i.qty, 0);
    const total = subtotal + Number(deliveryFee || 0);

    const order = await Order.create({
      items: snapItems,
      subtotal,
      deliveryFee,
      total,
      createdBy: req.user?.id
    });

    res.status(201).json(order);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/orders/:id
const updateOrder = async (req, res) => {
  const { id } = req.params;
  if (badId(id)) return res.status(400).json({ message: 'Invalid order id' });

  try {
    // only allow changing status or deliveryFee (keep items immutable for simplicity)
    const allowed = {};
    if (req.body.status !== undefined) allowed.status = req.body.status;
    if (req.body.deliveryFee !== undefined) {
      allowed.deliveryFee = req.body.deliveryFee;
    }

    // if deliveryFee changed, recompute total
    if (allowed.deliveryFee !== undefined) {
      const current = await Order.findById(id).lean();
      if (!current) return res.status(404).json({ message: 'Order not found' });
      allowed.total = current.subtotal + Number(allowed.deliveryFee);
    }

    const order = await Order.findByIdAndUpdate(id, allowed, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/orders/:id
const deleteOrder = async (req, res) => {
  const { id } = req.params;
  if (badId(id)) return res.status(400).json({ message: 'Invalid order id' });

  try {
    const order = await Order.findByIdAndDelete(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getOrders, addOrder, updateOrder, deleteOrder };

