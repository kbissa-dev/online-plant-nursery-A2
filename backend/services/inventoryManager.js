const EventEmitter = require('events');
const { StripeAdapter, PaypalAdapter } = require('../payments/paymentAdapter');

class InventoryEvents extends EventEmitter {}
const inventoryEvents = new InventoryEvents();

class InventoryManager {
  constructor({ PlantModel, OrderModel, UserModel, lowStockThreshold = 5 }) {
    this.Plant = PlantModel;
    this.Order = OrderModel;
    this.User = UserModel;
    this.lowStockThreshold = lowStockThreshold;
  }

  async applyOrder({ userId, items = [], deliveryFee = 0, shipping = null, provider = 'stripe', channels = ['toast'] }) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    // check and reduce stock
    for (const it of items) {
      const updated = await this.adjustStock(it.plant, -it.qty);
      if (!updated) throw new Error(`Insufficient stock for plant ${it.plant}`);
    }

    // subtotal + total
    const subtotal = items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
    const total = subtotal + (Number(deliveryFee) || 0);

    // Payment Service (Adapter pattern) - Charging the Provider
    const payment = provider === 'paypal' ? new PaypalAdapter() : new StripeAdapter();
    const receipt = await payment.charge(total, { userId });
     
    const order = await this.Order.create({
      items,
      subtotal,
      deliveryFee,
      total,
      status: 'pending',
      provider, // such as stripe and paypal
      receiptId: receipt.id,
      shipping,
      createdBy: userId || null,
    });

    const displayNo = order.orderNumber ?? String(order._id).slice(-4);

    await this.Order.findByIdAndUpdate(order._id, {
      status: 'paid',
      provider,
      receiptId: receipt.id,
    });

    let customerName = 'Guest';

    if (userId && this.User){
      const userDoc = await this.User.findById(userId).lean();
      if(userDoc?.name) {
        customerName = userDoc.name;
      }
    }

    // update user loyalty status after successful order
    if (userId && this.User) {
      try {
        const user = await this.User.findById(userId);
        if (user) {
          const loyaltyUpdate = user.addPurchase(total, total);
          await user.save();
          
          // log loyalty changes for notifications
          if (loyaltyUpdate.tierChanged) {
            console.log(`User ${userId} upgraded to ${loyaltyUpdate.newTier} tier!`);
          }
          console.log(`User earned ${loyaltyUpdate.pointsEarned} loyalty points`);
        }
      } catch (error) {
        console.error('Failed to update user loyalty status:', error);
      }
    }

    // Notification Service (decorator pattern) - Send notification
    const { buildNotifier } = require("./notificationService");
    const notifier = buildNotifier(channels);
    notifier.send(`Order #${displayNo} placed successfully by ${customerName}!`);

    console.log("💳", provider, "charging", total, "→ receipt", receipt.id);
    return order.toObject();
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

  async adjustStock(plantId, delta) {
    delta = Number(delta || 0);
    let query = {_id: plantId };
    if (delta < 0) {
      // require resulting stock > lowStockThreshold
      // i.e., stock + delta >= lowStockThreshold + 1
      query = {
        ...query,
        stock: { $gte: (-delta) }
      };
    }
    // const guard = delta < 0 ? { stock: { $gte: -delta } } : {};
    const updated = await this.Plant.findOneAndUpdate(
      //{ _id: plantId, ...guard },
      query,
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
}

module.exports = {
  InventoryManager,
  inventoryEvents,
};
