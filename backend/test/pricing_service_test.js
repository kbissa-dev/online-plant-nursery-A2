const { expect } = require('chai');
const sinon = require('sinon');
const PricingService = require('../services/pricingService');

describe('PricingService', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('dollarsToCents', () => {
    it('should convert dollars to cents correctly', () => {
      expect(PricingService.dollarsToCents(10)).to.equal(1000);
      expect(PricingService.dollarsToCents(25.99)).to.equal(2599);
      expect(PricingService.dollarsToCents('15.50')).to.equal(1550);
      expect(PricingService.dollarsToCents(0)).to.equal(0);
    });

    it('should handle floating point precision', () => {
      expect(PricingService.dollarsToCents(19.99)).to.equal(1999);
      expect(PricingService.dollarsToCents(0.01)).to.equal(1);
      expect(PricingService.dollarsToCents(999.99)).to.equal(99999);
    });
  });

  describe('centsToDollars', () => {
    it('should convert cents to dollars with 2 decimal places', () => {
      expect(PricingService.centsToDollars(1000)).to.equal('10.00');
      expect(PricingService.centsToDollars(2599)).to.equal('25.99');
      expect(PricingService.centsToDollars(1)).to.equal('0.01');
      expect(PricingService.centsToDollars(0)).to.equal('0.00');
    });
  });

  describe('getSubtotalInCents', () => {
    it('should calculate subtotal in cents correctly', () => {
      const cart = {
        items: [
          { plant: { price: 10.99 }, qty: 2 },
          { plant: { price: 25.50 }, qty: 1 },
          { plant: { price: 5.00 }, qty: 3 }
        ]
      };

      // 10.99 * 2 + 25.50 * 1 + 5.00 * 3
      // = 21.98 + 25.50 + 15.00 = 62.48
      //     2198 + 2550 + 1500 = 6248
      const expected = 1099 * 2 + 2550 * 1 + 500 * 3; 
      
      expect(PricingService.getSubtotalInCents(cart)).to.equal(expected);
    });

    it('should return 0 for empty cart', () => {
      const cart = { items: [] };
      expect(PricingService.getSubtotalInCents(cart)).to.equal(0);
    });
  });

  describe('calculateTotals', () => {
    it('should calculate totals with no discounts', async () => {
      const cart = {
        items: [
          { plant: { price: 20 }, qty: 1 },
          { plant: { price: 15 }, qty: 2 }
        ]
      };

      const user = { loyaltyTier: 'green' };

      const DiscountStrategyFactory = {
        create: sinon.stub().returns([])
      };

      global.DiscountStrategyFactory = DiscountStrategyFactory;

      const result = await PricingService.calculateTotals(cart, user);

      expect(result.subtotalInCents).to.equal(5000); // 20*1 + 15*2 = $50 = 5000 cents
      expect(result.totalDiscountInCents).to.equal(0);
      expect(result.totalInCents).to.equal(5000);
      expect(result.discounts).to.be.an('array').that.is.empty;
      expect(result.subtotal).to.equal('50.00');
      expect(result.totalDiscount).to.equal('0.00');
      expect(result.total).to.equal('50.00');

      delete global.DiscountStrategyFactory;
    });

      it('should calculate totals with bulk discount', async () => {
    const cart = {
      items: [
        { plant: { price: 10 }, qty: 5 },
        { plant: { price: 20 }, qty: 3 }
      ]
    };

      const user = { loyaltyTier: 'green' };

      const result = await PricingService.calculateTotals(cart, user);

      expect(result.subtotalInCents).to.equal(11000); 
      expect(result.totalDiscountInCents).to.equal(550); 
      expect(result.totalInCents).to.equal(10450); 
      expect(result.discounts).to.have.length(1);
      expect(result.discounts[0]).to.include({
        name: 'Bulk Discount',
        amountInCents: 550,
        amount: '5.50',
        description: '5% off 5+ items (8 items)'
      });
      expect(result.subtotal).to.equal('110.00');
      expect(result.totalDiscount).to.equal('5.50');
      expect(result.total).to.equal('104.50');

      delete global.DiscountStrategyFactory;
    });

    it('should handle multiple discount strategies', async () => {
      const cart = {
        items: [
          { plant: { price: 30 }, qty: 10 }
        ]
      };

      const user = { loyaltyTier: 'gold' };

      const bulkStrategy = {
        name: 'Bulk Discount',
        calculateInCents: sinon.stub().resolves({
          amountInCents: 3000, // $30 discount
          description: '10% off 10+ items'
        })
      };

      const loyaltyStrategy = {
        name: 'Loyalty Discount',
        calculateInCents: sinon.stub().resolves({
          amountInCents: 3000, // $30 discount
          description: 'Gold member 10% off'
        })
      };

      const DiscountStrategyFactory = {
        create: sinon.stub().returns([bulkStrategy, loyaltyStrategy])
      };

      global.DiscountStrategyFactory = DiscountStrategyFactory;

      const result = await PricingService.calculateTotals(cart, user);

      expect(result.subtotalInCents).to.equal(30000); // 30*10 = $300
      expect(result.totalDiscountInCents).to.equal(6000); // 30 + 30 = $60 discount
      expect(result.totalInCents).to.equal(24000); // 300 - 60 = $240
      expect(result.discounts).to.have.length(2);
      expect(result.total).to.equal('240.00');

      delete global.DiscountStrategyFactory;
    });

    it('should return empty totals for empty cart', async () => {
      const cart = null;
      const user = {};

      const result = await PricingService.calculateTotals(cart, user);

      expect(result.subtotalInCents).to.equal(0);
      expect(result.totalDiscountInCents).to.equal(0);
      expect(result.totalInCents).to.equal(0);
      expect(result.discounts).to.be.an('array').that.is.empty;
      expect(result.subtotal).to.equal('0.00');
      expect(result.totalDiscount).to.equal('0.00');
      expect(result.total).to.equal('0.00');
    });

    it('should handle discount strategy errors gracefully', async () => {
      const cart = {
        items: [{ plant: { price: 50 }, qty: 1 }]
      };

      const user = {};

      const faultyStrategy = {
        name: 'Faulty Discount',
        calculateInCents: sinon.stub().rejects(new Error('Calculation failed'))
      };

      const workingStrategy = {
        name: 'Working Discount',
        calculateInCents: sinon.stub().resolves({
          amountInCents: 1000, // $10 discount
          description: 'Valid discount'
        })
      };

      const DiscountStrategyFactory = {
        create: sinon.stub().returns([faultyStrategy, workingStrategy])
      };

      global.DiscountStrategyFactory = DiscountStrategyFactory;

      const consoleErrorSpy = sinon.spy(console, 'error');

      const result = await PricingService.calculateTotals(cart, user);

      expect(result.subtotalInCents).to.equal(5000);
      expect(result.totalDiscountInCents).to.equal(1000);
      expect(result.totalInCents).to.equal(4000);
      expect(result.discounts).to.have.length(1);
      expect(result.discounts[0].name).to.equal('Working Discount');

      expect(consoleErrorSpy.calledWith('Error applying Faulty Discount:')).to.be.true;

      delete global.DiscountStrategyFactory;
    });

    it('should ensure total never goes below zero', async () => {
      const cart = {
        items: [{ plant: { price: 10 }, qty: 1 }]
      };

      const user = {};

      const excessiveStrategy = {
        name: 'Excessive Discount',
        calculateInCents: sinon.stub().resolves({
          amountInCents: 2000, // $20 discount on $10 item
          description: 'Too much discount'
        })
      };

      const DiscountStrategyFactory = {
        create: sinon.stub().returns([excessiveStrategy])
      };

      global.DiscountStrategyFactory = DiscountStrategyFactory;

      const result = await PricingService.calculateTotals(cart, user);

      expect(result.subtotalInCents).to.equal(1000);
      expect(result.totalDiscountInCents).to.equal(2000);
      expect(result.totalInCents).to.equal(0); // should be 0 and not negative
      expect(result.total).to.equal('0.00');

      delete global.DiscountStrategyFactory;
    });
  });
});