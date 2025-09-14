const mongoose = require('mongoose');
const Order = require('../models/Order');
const Plant = require('../models/Plant');

const badId = (id) => !mongoose.Types.ObjectId.isValid(id);

// GET /api/orders
const getOrders = async (req, res) => {
  try {
    const query = req.user?.id ? { createdBy: req.user.id } : {};
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
      return res.status(400).json({ message: "items is required (non-empty array)" });
    }

    // fetch plants by ids and index them
    const plantIds = items.map(i => i.plant);
    const plants = await Plant.find({ _id: { $in: plantIds } }).lean();
    const byId = Object.fromEntries(plants.map(p => [String(p._id), p]));

    // snapshot list the UI can render later even if products change
    const snapItems = items.map(i => {
      const p = byId[i.plant];
      if (!p) throw new Error("One or more plants not found");
      const qty = Number(i.qty);
      if (!Number.isFinite(qty) || qty <= 0) throw new Error("qty must be >= 1");
      return { plant: p._id, name: p.name, price: p.price, qty };
    });

    const subtotal = snapItems.reduce((s, it) => s + it.price * it.qty, 0);
    const deliveryFeeNum = Number(deliveryFee) || 0;   //  parse 
    const total = subtotal + deliveryFeeNum;

    const order = await Order.create({
      items: snapItems,
      subtotal,
      deliveryFee: deliveryFeeNum,                     //  store number
      total,
      status: "pending",                               // pending until payment step marks 'paid'
      createdBy: req.user?.id || null,
    });

    return res.status(201).json(order);
  } catch (err) {
    const message = err?.message || "Create order failed";
    return res.status(message.includes("qty") || message.includes("not found") ? 400 : 500)
              .json({ message });
  }
};



// PUT /api/orders/:id
// PUT /api/orders/:id
const updateOrder = async (req, res) => {
  const { id } = req.params;
  if (badId(id)) return res.status(400).json({ message: 'Invalid order id' });

  try {
    const allowed = {};
    if (req.body.status !== undefined) {
      // optionally whitelist: ['pending','paid','cancelled','shipped'] etc.
      allowed.status = req.body.status;
    }
    if (req.body.deliveryFee !== undefined) {
      allowed.deliveryFee = Number(req.body.deliveryFee) || 0; // <-- coerce to number
    }

    if (allowed.deliveryFee !== undefined) {
      const current = await Order.findById(id).lean();
      if (!current) return res.status(404).json({ message: 'Order not found' });
      allowed.total = current.subtotal + allowed.deliveryFee;
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

// Cancel Order by Customer (only if still pending)
// PUT /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    const o = await Order.findById(req.params.id);
    if (!o) return res.status(404).json({ error: "Order not found" });

    const diffMinutes = (Date.now() - new Date(o.createdAt)) / (1000 * 60);
    if (o.status !== "pending" || diffMinutes > 5) {
      return res.status(400).json({ error: "Cancel allowed only within 5 minutes for pending orders" });
    }

    o.status = "cancelled";
    await o.save();
    res.json({ success: true, order: o });
  } catch (err) {
    res.status(500).json({ error: "Cancel failed" });
  }
};


module.exports = { getOrders, addOrder, updateOrder, deleteOrder, cancelOrder };

