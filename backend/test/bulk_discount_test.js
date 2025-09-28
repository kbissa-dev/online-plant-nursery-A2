const { expect } = require('chai');
const sinon = require('sinon');
const BulkDiscount = require('../strategies/bulkDiscount');
const PricingService = require('../services/pricingService');

describe('BulkDiscount Strategy', () => {
  let bulkDiscount;

  beforeEach(() => {
    bulkDiscount = new BulkDiscount();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('should initialize with correct name and description', () => {
      expect(bulkDiscount.name).to.equal('Bulk Discount');
      expect(bulkDiscount.description).to.equal('Volume based pricing tiers');
    });

    it('should have correct discount tiers', () => {
      expect(bulkDiscount.tiers).to.have.length(3);
      
      // check 20% tier
      expect(bulkDiscount.tiers[0]).to.deep.equal({
        minQty: 20,
        discount: 20,
        label: '20% off 20+ items'
      });

      // check 10% tier
      expect(bulkDiscount.tiers[1]).to.deep.equal({
        minQty: 10,
        discount: 10,
        label: '10% off 10+ items'
      });

      // check 5% tier
      expect(bulkDiscount.tiers[2]).to.deep.equal({
        minQty: 5,
        discount: 5,
        label: '5% off 5+ items'
      });
    });
  });

  describe('calculateInCents', () => {
    it('should apply 20% discount for 20+ items', async () => {
      const cart = {
        items: [
          { plant: { price: 10 }, qty: 15 }, // total $150
          { plant: { price: 20 }, qty: 8 } // total $160
        ]
      };
      // total $310 for 23 items with 20% discount = $62 = 6200 cents

      const user = {};
      const result = await bulkDiscount.calculateInCents(cart, user);

      expect(result.amountInCents).to.equal(6200);
      expect(result.description).to.equal('20% off 20+ items (23 items)');
      expect(result.tier).to.equal(20);
    });

    it('should apply 10% discount for 10-19 items', async () => {      
      const cart = {
        items: [
          { plant: { price: 15 }, qty: 8 }, // total $120
          { plant: { price: 25 }, qty: 4 } // total $100
        ]
      };
      // total $220 for 12 items with 10% discount = $22 = 2200 cents

      const user = {};
      const result = await bulkDiscount.calculateInCents(cart, user);

      expect(result.amountInCents).to.equal(2200);
      expect(result.description).to.equal('10% off 10+ items (12 items)');
      expect(result.tier).to.equal(10);
    });

    it('should apply 5% discount for 5-9 items', async () => {
      const cart = {
        items: [
          { plant: { price: 20 }, qty: 3 }, // total $60
          { plant: { price: 30 }, qty: 2 } // total $60
        ]
      };
      // total $120 for 5 items with 5% discount = $6 = 600 cents

      const user = {};
      const result = await bulkDiscount.calculateInCents(cart, user);

      expect(result.amountInCents).to.equal(600);
      expect(result.description).to.equal('5% off 5+ items (5 items)');
      expect(result.tier).to.equal(5);
    });

    it('should apply no discount for less than 5 items', async () => {
      const cart = {
        items: [
          { plant: { price: 50 }, qty: 2 },
          { plant: { price: 25 }, qty: 1 }
        ]
      };
      // 3 items should get no discount

      const user = {};
      const result = await bulkDiscount.calculateInCents(cart, user);

      expect(result.amountInCents).to.equal(0);
      expect(result.description).to.equal('No eligible bulk discount.');
    });

    it('should handle edge case at exact tier boundary', async () => {
      const cart = {
        items: [
          { plant: { price: 10 }, qty: 10 } // total $100
        ]
      };
      // 10% discount on $100 = $10 = 1000 cents

      const user = {};
      const result = await bulkDiscount.calculateInCents(cart, user);

      expect(result.amountInCents).to.equal(1000);
      expect(result.description).to.equal('10% off 10+ items (10 items)');
      expect(result.tier).to.equal(10);
    });

    it('should handle empty cart', async () => {
      const cart = { items: [] };

      const user = {};
      const result = await bulkDiscount.calculateInCents(cart, user);

      expect(result.amountInCents).to.equal(0);
      expect(result.description).to.equal('No eligible bulk discount.');
    });
  });

  describe('getTotalItems (inherited method)', () => {
    it('should calculate total items correctly', () => {
      const cart = {
        items: [
          { plant: { price: 10 }, qty: 3 },
          { plant: { price: 20 }, qty: 5 },
          { plant: { price: 15 }, qty: 2 }
        ]
      };

      const totalItems = bulkDiscount.getTotalItems(cart);
      expect(totalItems).to.equal(10);
    });

    it('should return 0 for empty cart', () => {
      const cart = { items: [] };
      const totalItems = bulkDiscount.getTotalItems(cart);
      expect(totalItems).to.equal(0);
    });
  });
});