// backend/test/inventory_apply_order_test.js
const { expect } = require('chai');
const { InventoryManager, inventoryEvents } = require('../services/inventoryManager');

describe('InventoryManager.applyOrder', () => {
  it('decrements stock, creates order, and emits low-stock when threshold crossed', async () => {
    // In-memory "DB"
    const plants = {
      rose:   { _id: 'rose',   name: 'Rose',   price: 22, stock: 8 },
      lemon:  { _id: 'lemon',  name: 'Lemon',  price: 30, stock: 7 },
    };

    // Minimal Plant model stub WITH findOneAndUpdate().lean()
const Plant = {
    async findOneAndUpdate(query, update /* , options */) {
        const id = query._id;
        const delta = (update && update.$inc && update.$inc.stock) || 0;
        const p = plants[id];
        if (!p) return null;
    // enforce guard: don't allow negative result
        if ((p.stock + delta) < 0) return null;
        p.stock += delta;

    // IMPORTANT: return a "query-like" object where .lean() returns a *Promise*
       return {
        async lean() { return { ...p }; },
    };
  },

  async findById(id) {
    const p = plants[id];
    return p ? { async lean() { return { ...p }; } } : null;
  },

  async find(query) {               // used by listLowStock in other tests
    const max = query?.stock?.$lte ?? Infinity;
    const arr = Object.values(plants).filter(x => x.stock <= max);
    return {
      select() {
        return {
          async lean() {
            return arr.map(x => ({ name: x.name, stock: x.stock, category: 1 }));}
        };
       }
    };
   }
};


    // Order model stub: capture what would be created
    let createdOrder = null;
    const Order = {
      async create(doc) {
        createdOrder = { ...doc };
        return { toObject: () => createdOrder };
      }
    };

    // Manager with lowStockThreshold = 5
    const manager = new InventoryManager({
      PlantModel: Plant,
      OrderModel: Order,
      lowStockThreshold: 5,
    });

    // Listen for low-stock
    const gotLow = new Promise(resolve => {
      inventoryEvents.once('low-stock', resolve);
    });

    // Act: 6 roses (8 -> 2 low), 3 lemons (7 -> 4 low too)
    const order = await manager.applyOrder({
      userId: 'u1',
      items: [
        { plant: 'rose',  qty: 6, name: 'Rose',  price: 22 },
        { plant: 'lemon', qty: 3, name: 'Lemon', price: 30 },
      ],
      deliveryFee: 0,
      shipping: null,
    });

    // Assert totals
    expect(order.subtotal).to.equal(6 * 22 + 3 * 30);
    expect(order.total).to.equal(order.subtotal);

    // Assert stocks went down
    expect(plants.rose.stock).to.equal(2);
    expect(plants.lemon.stock).to.equal(4);

    // Assert an order was "created"
    expect(createdOrder).to.be.an('object');
    expect(createdOrder.items).to.have.length(2);

    // Assert low-stock event fired at least once
    const evt = await gotLow;             // resolves when first low-stock fires
    expect(evt).to.have.property('name'); // 'Rose' or 'Lemon'
    expect(evt.stock).to.be.at.most(5);
  });

  it('rejects when items is missing or empty', async () => {
    const Plant = { findOneAndUpdate: async () => null };
    const Order = {};
    const manager = new InventoryManager({ PlantModel: Plant, OrderModel: Order });

    try {
      await manager.applyOrder({ items: [] });
      throw new Error('should have thrown');
    } catch (e) {
      expect(String(e.message)).to.match(/at least one item/i);
    }
  });
});
