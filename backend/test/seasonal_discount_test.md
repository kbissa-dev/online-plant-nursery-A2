const { expect } = require('chai');
const sinon = require('sinon');
const SeasonalDiscount = require('../strategies/seasonalDiscount');
const PricingService = require('../services/pricingService');

describe('SeasonalDiscount Strategy', () => {
  let seasonalDiscount;
  let dateStub;

  beforeEach(() => {
    seasonalDiscount = new SeasonalDiscount();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('should initialize with correct name and description', () => {
      expect(seasonalDiscount.name).to.equal('Seasonal Discount');
      expect(seasonalDiscount.description).to.equal('Limited time seasonal promotion');
      expect(seasonalDiscount.priority).to.equal(5);
    });
  });

  describe('isEligible', () => {
    it('should return true during spring months (9, 10, 11) with outdoor plants', () => {
      // test September
      dateStub = sinon.stub(Date.prototype, 'getMonth').returns(8); // September (0 based)
      
      const cart = {
        items: [
          { plant: { category: 'Outdoor, Sun' } },
          { plant: { category: 'Indoor, Shade' } }
        ]
      };

      expect(seasonalDiscount.isEligible(cart, {})).to.be.true;
      dateStub.restore();

      // test October
      dateStub = sinon.stub(Date.prototype, 'getMonth').returns(9); // October (0 based)
      expect(seasonalDiscount.isEligible(cart, {})).to.be.true;
      dateStub.restore();

      // test November
      dateStub = sinon.stub(Date.prototype, 'getMonth').returns(10); // November (0 based)
      expect(seasonalDiscount.isEligible(cart, {})).to.be.true;
    });

    it('should return false during non-spring months', () => {
      // test December
      dateStub = sinon.stub(Date.prototype, 'getMonth').returns(11); // December (0 based)
      
      const cart = {
        items: [
          { plant: { category: 'Outdoor, Sun' } }
        ]
      };

      expect(seasonalDiscount.isEligible(cart, {})).to.be.false;
      dateStub.restore();

      // test January
      dateStub = sinon.stub(Date.prototype, 'getMonth').returns(0); // January (0 based)
      expect(seasonalDiscount.isEligible(cart, {})).to.be.false;
      dateStub.restore();

      // test June
      dateStub = sinon.stub(Date.prototype, 'getMonth').returns(5); // June (0 based)
      expect(seasonalDiscount.isEligible(cart, {})).to.be.false;
    });

    it('should return false during spring months without outdoor plants', () => {
      dateStub = sinon.stub(Date.prototype, 'getMonth').returns(8); // September
      
      const cart = {
        items: [
          { plant: { category: 'Indoor, Shade' } },
          { plant: { category: 'Foliage, Indoor' } }
        ]
      };

      expect(seasonalDiscount.isEligible(cart, {})).to.be.false;
    });

    it('should handle case-insensitive category matching', () => {
      dateStub = sinon.stub(Date.prototype, 'getMonth').returns(8); // September
      
      const cart = {
        items: [
          { plant: { category: 'OUTDOOR, SUN' } }
        ]
      };

      expect(seasonalDiscount.isEligible(cart, {})).to.be.true;
    });

    it('should return false for empty cart', () => {
      dateStub = sinon.stub(Date.prototype, 'getMonth').returns(8); // September
      
      const cart = { items: [] };

      expect(seasonalDiscount.isEligible(cart, {})).to.be.false;
    });

    it('should return false when plants have no category', () => {
      dateStub = sinon.stub(Date.prototype, 'getMonth').returns(8); // September
      
      const cart = {
        items: [
          { plant: { price: 20 } }, // no category
          { plant: { category: null } }
        ]
      };

      expect(seasonalDiscount.isEligible(cart, {})).to.be.false;
    });
  });

  describe('calculateInCents', () => {
    beforeEach(() => {
      dateStub = sinon.stub(Date.prototype, 'getMonth').returns(8); // September
    });

    it('should apply 15% discount to outdoor plants only', async () => {
      const cart = {
        items: [
          { plant: { price: 20, category: 'Outdoor, Sun' }, qty: 2 }, // $40 total = $6 discount
          { plant: { price: 30, category: 'Indoor, Shade' }, qty: 1 }, // no discount
          { plant: { price: 10, category: 'Flower, Outdoor' }, qty: 3 } // $30 total = $4.50 discount
        ]
      };

      const user = {};
      const result = await seasonalDiscount.calculateInCents(cart, user);

      // outdoor discounts
      // (20*2) * 0.15 + (10*3) * 0.15
      // = 6 + 4.5 = 10.5 = 1050 cents
      expect(result.amountInCents).to.equal(1050);
      expect(result.description).to.equal('Spring Promotion: 15% off outdoor plants');
      expect(result.itemsAffected).to.equal(2); // 2 outdoor plant types
    });

    it('should return zero discount when not eligible (non-spring month)', async () => {
      dateStub.restore();
      dateStub = sinon.stub(Date.prototype, 'getMonth').returns(11); // December
      
      const cart = {
        items: [
          { plant: { price: 20, category: 'Outdoor, Sun' }, qty: 2 }
        ]
      };

      const user = {};
      const result = await seasonalDiscount.calculateInCents(cart, user);

      expect(result.amountInCents).to.equal(0);
      expect(result.description).to.equal('No eligible seasonal promotion.');
    });

    it('should return zero discount when no outdoor plants', async () => {
      const cart = {
        items: [
          { plant: { price: 25, category: 'Indoor, Shade' }, qty: 2 },
          { plant: { price: 15, category: 'Foliage, Indoor' }, qty: 1 }
        ]
      };

      const user = {};
      const result = await seasonalDiscount.calculateInCents(cart, user);

      expect(result.amountInCents).to.equal(0);
      expect(result.description).to.equal('No eligible seasonal promotion.');
    });

    it('should handle single outdoor plant correctly', async () => {
      const cart = {
        items: [
          { plant: { price: 50, category: 'Outdoor, Sun' }, qty: 1 }
        ]
      };

      const user = {};
      const result = await seasonalDiscount.calculateInCents(cart, user);

      // 50 * 0.15 = 7.5 = 750 cents
      expect(result.amountInCents).to.equal(750);
      expect(result.description).to.equal('Spring Promotion: 15% off outdoor plants');
      expect(result.itemsAffected).to.equal(1);
    });

    it('should handle high quantity outdoor plants', async () => {
      const cart = {
        items: [
          { plant: { price: 15, category: 'Outdoor, Part Sun' }, qty: 10 }
        ]
      };

      const user = {};
      const result = await seasonalDiscount.calculateInCents(cart, user);

      // (15 * 10) * 0.15
      // = 150 * 0.15 = 22.5 = 2250 cents
      expect(result.amountInCents).to.equal(2250);
      expect(result.itemsAffected).to.equal(1);
    });

    it('should handle decimal prices correctly', async () => {
      const cart = {
        items: [
          { plant: { price: 19.99, category: 'Outdoor, Sun' }, qty: 1 }
        ]
      };

      const user = {};
      const result = await seasonalDiscount.calculateInCents(cart, user);

      // 19.99 * 0.15 = 2.9985, Math.floor(2998.5) = 2998 cents
      expect(result.amountInCents).to.equal(299); // Math.floor applied
    });

    it('should handle empty cart', async () => {
      const cart = { items: [] };

      const user = {};
      const result = await seasonalDiscount.calculateInCents(cart, user);

      expect(result.amountInCents).to.equal(0);
      expect(result.description).to.equal('No eligible seasonal promotion.');
    });

    it('should handle partial outdoor category matching', async () => {
      const cart = {
        items: [
          { plant: { price: 20, category: 'Herb, Outdoor, Sun' }, qty: 1 },
          { plant: { price: 25, category: 'Fruit, Outdoor, Part' }, qty: 1 },
          { plant: { category: 'Indoor, Low Light' }, qty: 1 } // should be excluded
        ]
      };

      const user = {};
      const result = await seasonalDiscount.calculateInCents(cart, user);

      // (20 * 0.15) + (25 * 0.15)
      // = 3 + 3.75 = 6.75 = 675 cents
      expect(result.amountInCents).to.equal(675);
      expect(result.itemsAffected).to.equal(2);
    });

    it('should handle mixed case categories', async () => {
      const cart = {
        items: [
          { plant: { price: 30, category: 'OUTDOOR, FULL SUN' }, qty: 1 },
          { plant: { price: 20, category: 'outdoor, shade' }, qty: 1 }
        ]
      };

      const user = {};
      const result = await seasonalDiscount.calculateInCents(cart, user);

      // (30 * 0.15) + (20 * 0.15)
      // = 4.5 + 3 = 7.5 = 750 cents
      expect(result.amountInCents).to.equal(750);
      expect(result.itemsAffected).to.equal(2);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined categories gracefully', async () => {
      dateStub = sinon.stub(Date.prototype, 'getMonth').returns(8); // September
      
      const cart = {
        items: [
          { plant: { price: 20, category: null }, qty: 1 },
          { plant: { price: 15 }, qty: 1 }, // no category property
          { plant: { price: 25, category: 'Outdoor, Sun' }, qty: 1 }
        ]
      };

      const user = {};
      const result = await seasonalDiscount.calculateInCents(cart, user);

      // only the last item should get discount
      // 25 * 0.15 = 375 cents
      expect(result.amountInCents).to.equal(375);
      expect(result.itemsAffected).to.equal(1);
    });

    it('should handle zero quantity items', async () => {
      dateStub = sinon.stub(Date.prototype, 'getMonth').returns(8); // September
      
      const cart = {
        items: [
          { plant: { price: 20, category: 'Outdoor, Sun' }, qty: 0 },
          { plant: { price: 30, category: 'Outdoor, Part' }, qty: 2 }
        ]
      };

      const user = {};
      const result = await seasonalDiscount.calculateInCents(cart, user);

      // only second item should get discount
      // 30 * 2 * 0.15 = 900 cents
      expect(result.amountInCents).to.equal(900);
      expect(result.itemsAffected).to.equal(2); // counts item types, not quantities
    });
  });
});