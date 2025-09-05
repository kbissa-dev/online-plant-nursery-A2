// backend/services/inventoryManager.js
const EventEmitter = require('events');

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
  async applyOrder({ userId, items = [], deliveryFee = 0, shipping = null }) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    // Check + decrement stock
    for (const it of items) {
      const updated = await this.adjustStock(it.plant, -it.qty);
      if (!updated) throw new Error(`Insufficient stock for plant ${it.plant}`);
    }

    // Snapshot: subtotal + total
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const total = subtotal + Number(deliveryFee || 0);

    // Create Order document
    const order = await this.Order.create({
      items,
      subtotal,
      deliveryFee,
      total,
      status: 'paid',
      shipping,
      createdBy: userId || null,
    });

    return order.toObject();
  }
}

module.exports = {
  InventoryManager,
  inventoryEvents,
};
