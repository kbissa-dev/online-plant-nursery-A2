// backend/services/inventoryManager.js
const EventEmitter = require('events');
const { StripeAdapter, PaypalAdapter } = require('../payments/paymentAdapter');


class InventoryEvents extends EventEmitter {}
const inventoryEvents = new InventoryEvents();

class InventoryManager {
  constructor({ PlantModel, OrderModel, lowStockThreshold = 5 }) {
    this.Plant = PlantModel;
    this.Order = OrderModel;
    this.lowStockThreshold = lowStockThreshold;
  }

  _emitLowStockIfNeeded(doc) {
    if (!doc || typeof doc.stock !== 'number') return;
    if (doc.stock <= this.lowStockThreshold) {
      inventoryEvents.emit('low-stock', {
        plantId: doc._id?.toString?.(),
        name: doc.name,
        stock: doc.stock,
        threshold: this.lowStockThreshold,
      });
    }
  }

  // ---- Stock operations ----
  async adjustStock(plantId, delta) {
    delta = Number(delta || 0);
    const guard = delta < 0 ? { stock: { $gte: -delta } } : {};
    const updated = await this.Plant.findOneAndUpdate(
      { _id: plantId, ...guard },
      { $inc: { stock: delta } },
      { new: true }
    ).lean();

    if (!updated) throw new Error('Insufficient stock or plant not found');
    this._emitLowStockIfNeeded(updated);
    return updated;
  }

  async checkStock(plantId) {
    const p = await this.Plant.findById(plantId).lean();
    if (!p) throw new Error('Plant not found');
    return p.stock;
  }

  async listLowStock() {
    return this.Plant.find({ stock: { $lte: this.lowStockThreshold } })
      .select({ name: 1, stock: 1, category: 1 })
      .lean();
  }

  // ---- Orders that also reduce stock ----
 async applyOrder({ userId, items = [], deliveryFee = 0, shipping = null, provider = 'stripe', channels = ['toast'] }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Order must have at least one item');
  }

  // Check & decrement stock
  for (const it of items) {
    const updated = await this.adjustStock(it.plant, -it.qty);
    if (!updated) throw new Error(`Insufficient stock for plant ${it.plant}`);
  }

  // subtotal + total
  const subtotal = items.reduce((s, i) => s + Number(i.price) * Number(i.qty),0);
  const total = subtotal + (Number(deliveryFee) || 0);

  // Payment Service (Adapter pattern)- Charging the Provider
   const payment = provider === 'paypal' ? new PaypalAdapter() : new StripeAdapter();
   const receipt = await payment.charge(total, { userId });
   
  // Create Order document
  const order = await this.Order.create({
    items,
    subtotal,
    deliveryFee,
    total,
    status: 'pending',
    provider,          // 'stripe' or 'paypal'
    receiptId: receipt.id, // receiptID field
    shipping,
    createdBy: userId || null,
  });

   
   // Marking order as Paid and attached payment data
    await this.Order.findByIdAndUpdate(order._id, {
      status: 'paid',
      provider,
      receiptId: receipt.id,
    });

  // Notification Service (decorator pattern)- Send notification
  const { buildNotifier } = require("./notificationService");
  const notifier = buildNotifier(["email", "sms", "toast"]);
  notifier.send(`Order ${order._id} placed successfully!`);

  console.log("💳", provider, "charging", total, "→ receipt", receipt.id);
  return order.toObject();
}
}

module.exports = {
  InventoryManager,
  inventoryEvents,
};
