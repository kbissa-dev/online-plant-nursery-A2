// backend/test/inventory_test.js
const { expect } = require('chai');

describe('Inventory low-stock event', () => {
  it('emits "low-stock" when stock drops below threshold', async () => {
    const { InventoryManager, inventoryEvents } = require('../services/inventoryManager');

    // stub Plant/Order models with .lean()
    const Plant = {
        findOneAndUpdate: () => ({
            lean: async () => ({ _id: '1', name: 'Rose', stock: 3 }),
        }),
};

    const Order = {};

    const manager = new InventoryManager({
      PlantModel: Plant,
      OrderModel: Order,
      lowStockThreshold: 5
    });

    const got = new Promise(resolve => inventoryEvents.once('low-stock', resolve));

    await manager.adjustStock('1', -1); // triggers low-stock (3 <= 5)
    const evt = await got;

    expect(evt.name).to.equal('Rose');
    expect(evt.stock).to.be.at.most(5);
  });
});
