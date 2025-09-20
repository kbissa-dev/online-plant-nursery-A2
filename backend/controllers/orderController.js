const mongoose = require('mongoose');
const Order = require('../models/Order');
const Plant = require('../models/Plant');

const badId = (id) => !mongoose.Types.ObjectId.isValid(id);

// GET /api/orders with role based order fetching
const getOrders = async (req, res) => {
  try {
    let query = {};
    
    // customers see their orders only
    if (req.user.isCustomer()) {
      query.createdBy = req.user.id;
    }
    
    // staff/admin see all orders
    const orders = await Order.find(query)
      .populate('createdBy', 'name email')
      .populate('processedBy', 'name employeeId')
      .populate('shippedBy', 'name employeeId')  
      .sort({ createdAt: -1 })
      .lean();
      
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/orders/:id with role based order updates
const updateOrder = async (req, res) => {
  const { id } = req.params;
  if (badId(id)) return res.status(400).json({ message: 'Invalid order id.' });

  try {
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    // customers can only update their own orders and/or cancel their own orders within 5 minutes
    if (req.user.isCustomer()) {
      if (order.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Can only update your own orders.' });
      }
      const diffMinutes = (Date.now() - new Date(order.createdAt)) / (1000 * 60);
      if (req.body.status === 'cancelled' && diffMinutes > 5) {
        return res.status(400).json({ message: 'Cancel allowed only within 5 minutes.' });
      }
    }
    
    const allowed = {};
    
    // staff can update order management status and delivery fee
    if (req.user.canManagePlants()) {
      if (req.body.status !== undefined) {
        allowed.status = req.body.status;
        
        if (req.body.status === 'processing') {
          allowed.processedBy = req.user.id;
        }
        if (req.body.status === 'shipped') {
          allowed.shippedBy = req.user.id;
        }
        
        allowed.$push = {
          statusHistory: {
            status: req.body.status,
            updatedBy: req.user.id,
            updatedAt: new Date(),
            notes: req.body.notes || ''
          }
        };
      }
      
      if (req.body.deliveryFee !== undefined) {
        allowed.deliveryFee = Number(req.body.deliveryFee) || 0;
        const current = await Order.findById(id).lean();
        allowed.total = current.subtotal + allowed.deliveryFee;
      }
    }
    
    if (req.user.isCustomer() && req.body.status) {
      if (req.body.status !== 'cancelled') {
        return res.status(403).json({ message: 'Customers can only cancel orders.' });
      }
      allowed.status = 'cancelled';
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, allowed, { 
      new: true, 
      runValidators: true 
    });
    
    res.json(updatedOrder);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

const addOrder = async (req, res) => {
  try {
    const { items = [], deliveryFee = 0 } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items is required (non-empty array)" });
    }

    const plantIds = items.map(i => i.plant);
    const plants = await Plant.find({ _id: { $in: plantIds } }).lean();
    const byId = Object.fromEntries(plants.map(p => [String(p._id), p]));

    const snapItems = items.map(i => {
      const p = byId[i.plant];
      if (!p) throw new Error("One or more plants not found");
      const qty = Number(i.qty);
      if (!Number.isFinite(qty) || qty <= 0) throw new Error("qty must be >= 1");
      return { plant: p._id, name: p.name, price: p.price, qty };
    });

    const subtotal = snapItems.reduce((s, it) => s + it.price * it.qty, 0);
    const deliveryFeeNum = Number(deliveryFee) || 0;
    const total = subtotal + deliveryFeeNum;

    const order = await Order.create({
      items: snapItems,
      subtotal,
      deliveryFee: deliveryFeeNum,
      total,
      status: "pending",
      createdBy: req.user?.id || null,
    });

    return res.status(201).json(order);
  } catch (err) {
    const message = err?.message || "Create order failed";
    return res.status(message.includes("qty") || message.includes("not found") ? 400 : 500).json({ message });
  }
};

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

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // customers can only update their own orders and/or cancel their own orders within 5 minutes
    if (req.user.isCustomer() && order.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Can only cancel your own orders" });
    }
    const diffMinutes = (Date.now() - new Date(order.createdAt)) / (1000 * 60);
    if (order.status !== "pending" || diffMinutes > 5) {
      return res.status(400).json({ error: "Cancel allowed only within 5 minutes for pending orders" });
    }

    order.status = "cancelled";
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: "Cancel failed" });
  }
};

module.exports = { getOrders, addOrder, updateOrder, deleteOrder, cancelOrder };

