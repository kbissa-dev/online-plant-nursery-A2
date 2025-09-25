const { expect } = require('chai');
const sinon = require('sinon');
const LoyaltyDiscount = require('../strategies/loyaltyDiscount');

describe('LoyaltyDiscount Strategy', () => {
  let loyaltyDiscount;

  beforeEach(() => {
    loyaltyDiscount = new LoyaltyDiscount();
    
    sinon.stub(loyaltyDiscount, 'getSubtotalInCents').callsFake((cart) => {
      return cart.items.reduce((total, item) => {
        const priceInCents = Math.round(item.plant.price * 100);
        return total + (priceInCents * item.qty);
      }, 0);
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('should initialize with correct name and description', () => {
      expect(loyaltyDiscount.name).to.equal('Loyalty Discount');
      expect(loyaltyDiscount.description).to.equal('Member tier discounts');
      expect(loyaltyDiscount.priority).to.equal(15);
    });

    it('should have correct loyalty tiers', () => {
      expect(loyaltyDiscount.tiers).to.deep.equal({
        'platinum': 15,
        'gold': 10,
        'silver': 5,
        'green': 0
      });
    });
  });

  describe('isEligible', () => {
    it('should return true for platinum tier users', () => {
      const cart = { items: [] };
      const platinumUser = { loyaltyTier: 'platinum' };
      expect(loyaltyDiscount.isEligible(cart, platinumUser)).to.be.true;
    });

    it('should return true for gold tier users', () => {
      const cart = { items: [] };
      const goldUser = { loyaltyTier: 'gold' };
      expect(loyaltyDiscount.isEligible(cart, goldUser)).to.be.true;
    });

    it('should return true for silver tier users', () => {
      const cart = { items: [] };
      const silverUser = { loyaltyTier: 'silver' };
      expect(loyaltyDiscount.isEligible(cart, silverUser)).to.be.true;
    });

    it('should return true for green tier users', () => {
      const cart = { items: [] };
      const greenUser = { loyaltyTier: 'green' };
      expect(loyaltyDiscount.isEligible(cart, greenUser)).to.be.true;
    });

    it('should return false for users without loyalty tier', () => {
      const cart = { items: [] };
      const userWithoutTier = {};
      expect(loyaltyDiscount.isEligible(cart, userWithoutTier)).to.be.false;
    });

    it('should return false when no user provided', () => {
      const cart = { items: [] };
      expect(loyaltyDiscount.isEligible(cart, null)).to.be.false;
      expect(loyaltyDiscount.isEligible(cart, undefined)).to.be.false;
    });

    it('should return false for invalid loyalty tier', () => {
      const cart = { items: [] };
      const userWithInvalidTier = { loyaltyTier: 'diamond' };
      expect(loyaltyDiscount.isEligible(cart, userWithInvalidTier)).to.be.false;
    });
  });

  describe('calculateInCents', () => {
    it('should apply 15% discount for platinum members', async () => {
      const cart = {
        items: [
          { plant: { price: 20 }, qty: 2 }, // $40
          { plant: { price: 30 }, qty: 1 }  // $30
        ]
      };
      // total $70 = 7000 cents with 15% discount = 1050 cents

      const platinumUser = { loyaltyTier: 'platinum' };
      const result = await loyaltyDiscount.calculateInCents(cart, platinumUser);

      expect(result.amountInCents).to.equal(1050);
      expect(result.description).to.equal('PLATINUM member: 15% off');
      expect(result.discountPercent).to.equal(15);
      expect(result.tier).to.equal('platinum');
    });

    it('should apply 10% discount for gold members', async () => {
      const cart = {
        items: [
          { plant: { price: 50 }, qty: 2 } // $100
        ]
      };
      // total $100 = 10000 cents with 10% discount = 1000 cents

      const goldUser = { loyaltyTier: 'gold' };
      const result = await loyaltyDiscount.calculateInCents(cart, goldUser);

      expect(result.amountInCents).to.equal(1000);
      expect(result.description).to.equal('GOLD member: 10% off');
      expect(result.discountPercent).to.equal(10);
      expect(result.tier).to.equal('gold');
    });

    it('should apply 5% discount for silver members', async () => {
      const cart = {
        items: [
          { plant: { price: 60 }, qty: 1 } // $60
        ]
      };
      // total $60 = 6000 cents with 5% discount = 300 cents

      const silverUser = { loyaltyTier: 'silver' };
      const result = await loyaltyDiscount.calculateInCents(cart, silverUser);

      expect(result.amountInCents).to.equal(300);
      expect(result.description).to.equal('SILVER member: 5% off');
      expect(result.discountPercent).to.equal(5);
      expect(result.tier).to.equal('silver');
    });

    it('should return special message for green members (no discount)', async () => {
      const cart = {
        items: [
          { plant: { price: 25 }, qty: 2 } // $50
        ]
      };

      const greenUser = { loyaltyTier: 'green' };
      const result = await loyaltyDiscount.calculateInCents(cart, greenUser);

      expect(result.amountInCents).to.equal(0);
      expect(result.description).to.equal('Green loyalty status, reach Silver status to get 5% off.');
    });

    it('should return non-member message for users without loyalty tier', async () => {
      const cart = {
        items: [
          { plant: { price: 40 }, qty: 1 }
        ]
      };

      const nonMember = {};
      const result = await loyaltyDiscount.calculateInCents(cart, nonMember);

      expect(result.amountInCents).to.equal(0);
      expect(result.description).to.equal('Not a member. Become a member now to start earning loyalty rewards.');
    });

    it('should handle decimal prices correctly', async () => {
      const cart = {
        items: [
          { plant: { price: 19.99 }, qty: 1 }, // 1999 cents
          { plant: { price: 25.50 }, qty: 2 }  // 5100 cents
        ]
      };
      // total 7099 cents with 10% discount = 709 cents (Math.floor)

      const goldUser = { loyaltyTier: 'gold' };
      const result = await loyaltyDiscount.calculateInCents(cart, goldUser);

      expect(result.amountInCents).to.equal(709);
      expect(result.description).to.equal('GOLD member: 10% off');
    });

    it('should handle large order for platinum member', async () => {
      const cart = {
        items: [
          { plant: { price: 100 }, qty: 5 }, // $500
          { plant: { price: 75 }, qty: 3 }   // $225
        ]
      };
      // total $725 = 72500 cents with 15% discount = 10875 cents

      const platinumUser = { loyaltyTier: 'platinum' };
      const result = await loyaltyDiscount.calculateInCents(cart, platinumUser);

      expect(result.amountInCents).to.equal(10875);
      expect(result.description).to.equal('PLATINUM member: 15% off');
      expect(result.discountPercent).to.equal(15);
    });

    it('should handle single item order', async () => {
      const cart = {
        items: [
          { plant: { price: 15 }, qty: 1 }
        ]
      };
      // total $15 = 1500 cents with 5% discount = 75 cents

      const silverUser = { loyaltyTier: 'silver' };
      const result = await loyaltyDiscount.calculateInCents(cart, silverUser);

      expect(result.amountInCents).to.equal(75);
      expect(result.description).to.equal('SILVER member: 5% off');
    });

    it('should handle empty cart for eligible user', async () => {
      const cart = { items: [] };
      const platinumUser = { loyaltyTier: 'platinum' };

      const result = await loyaltyDiscount.calculateInCents(cart, platinumUser);

      expect(result.amountInCents).to.equal(0);
      expect(result.description).to.equal('PLATINUM member: 15% off');
      expect(result.discountPercent).to.equal(15);
    });
  });

  describe('edge cases', () => {
    it('should handle null user gracefully', async () => {
      const cart = { items: [{ plant: { price: 10 }, qty: 1 }] };
      const result = await loyaltyDiscount.calculateInCents(cart, null);

      expect(result.amountInCents).to.equal(0);
      expect(result.description).to.equal('Not a member. Become a member now to start earning loyalty rewards.');
    });

    it('should handle undefined user gracefully', async () => {
      const cart = { items: [{ plant: { price: 10 }, qty: 1 }] };
      const result = await loyaltyDiscount.calculateInCents(cart, undefined);

      expect(result.amountInCents).to.equal(0);
      expect(result.description).to.equal('Not a member. Become a member now to start earning loyalty rewards.');
    });

    it('should handle user without loyaltyTier property', async () => {
      const cart = { items: [{ plant: { price: 10 }, qty: 1 }] };
      const userWithoutTier = { name: 'John' };
      const result = await loyaltyDiscount.calculateInCents(cart, userWithoutTier);

      expect(result.amountInCents).to.equal(0);
      expect(result.description).to.equal('Not a member. Become a member now to start earning loyalty rewards.');
    });

    it('should handle invalid loyalty tier', async () => {
      const cart = { items: [{ plant: { price: 10 }, qty: 1 }] };
      const userWithInvalidTier = { loyaltyTier: 'diamond' };
      
      const result = await loyaltyDiscount.calculateInCents(cart, userWithInvalidTier);

      expect(result.amountInCents).to.equal(0);
      expect(result.description).to.equal('Not a member. Become a member now to start earning loyalty rewards.');
    });

    it('should handle zero quantity items', async () => {
      const cart = {
        items: [
          { plant: { price: 20 }, qty: 0 },
          { plant: { price: 30 }, qty: 2 }
        ]
      };
      // only second item
      // $60 = 6000 cents with 10% discount = 600 cents

      const goldUser = { loyaltyTier: 'gold' };
      const result = await loyaltyDiscount.calculateInCents(cart, goldUser);

      expect(result.amountInCents).to.equal(600);
      expect(result.description).to.equal('GOLD member: 10% off');
    });

    it('should handle very small amounts (rounding)', async () => {
      const cart = {
        items: [
          { plant: { price: 0.01 }, qty: 1 } // 1 cent
        ]
      };
      // 1 cent with 5% discount = 0.05 cents Math.floor to 0

      const silverUser = { loyaltyTier: 'silver' };
      const result = await loyaltyDiscount.calculateInCents(cart, silverUser);

      expect(result.amountInCents).to.equal(0);
      expect(result.description).to.equal('SILVER member: 5% off');
    });

    it('should handle case sensitivity in loyalty tier', async () => {
      const cart = {
        items: [
          { plant: { price: 20 }, qty: 1 }
        ]
      };

      // test uppercase
      const upperCaseUser = { loyaltyTier: 'PLATINUM' };
      const result1 = await loyaltyDiscount.calculateInCents(cart, upperCaseUser);
      expect(result1.amountInCents).to.equal(0); // should not match

      // test mixed case
      const mixedCaseUser = { loyaltyTier: 'Platinum' };
      const result2 = await loyaltyDiscount.calculateInCents(cart, mixedCaseUser);
      expect(result2.amountInCents).to.equal(0); // should not match
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

      const totalItems = loyaltyDiscount.getTotalItems(cart);
      expect(totalItems).to.equal(10);
    });

    it('should return 0 for empty cart', () => {
      const cart = { items: [] };
      const totalItems = loyaltyDiscount.getTotalItems(cart);
      expect(totalItems).to.equal(0);
    });
  });

  describe('getSubtotalInCents (inherited method)', () => {
    it('should calculate subtotal correctly', () => {
      loyaltyDiscount.getSubtotalInCents.restore();
      
      const cart = {
        items: [
          { plant: { price: 10.50 }, qty: 2 },
          { plant: { price: 25.25 }, qty: 1 }
        ]
      };
      // (10.50 * 2) + (25.25 * 1)
      // = 21.00 + 25.25 = 46.25 = 4625 cents
      const subtotal = loyaltyDiscount.getSubtotalInCents(cart);
      expect(subtotal).to.equal(4625);
    });
  });
});