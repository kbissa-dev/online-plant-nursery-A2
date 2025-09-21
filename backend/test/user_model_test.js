const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const User = require('../models/User');
const { USER_ROLES } = require('../models/User');

describe('User Model', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('Role Methods', () => {
    it('should correctly identify customer role', () => {
      const user = new User({ role: USER_ROLES.CUSTOMER });
      
      expect(user.isCustomer()).to.be.true;
      expect(user.isStaff()).to.be.false;
      expect(user.isAdmin()).to.be.false;
      expect(user.canManagePlants()).to.be.false;
      expect(user.canManageUsers()).to.be.false;
    });

    it('should correctly identify staff role', () => {
      const user = new User({ role: USER_ROLES.STAFF });
      
      expect(user.isCustomer()).to.be.false;
      expect(user.isStaff()).to.be.true;
      expect(user.isAdmin()).to.be.false;
      expect(user.canManagePlants()).to.be.true;
      expect(user.canManageUsers()).to.be.false;
    });

    it('should correctly identify admin role', () => {
      const user = new User({ role: USER_ROLES.ADMIN });
      
      expect(user.isCustomer()).to.be.false;
      expect(user.isStaff()).to.be.false;
      expect(user.isAdmin()).to.be.true;
      expect(user.canManagePlants()).to.be.true;
      expect(user.canManageUsers()).to.be.true;
    });
  });

  describe('Loyalty Tier Updates', () => {
    it('should update loyalty tier to silver at $100 spent', () => {
      const user = new User({
        role: USER_ROLES.CUSTOMER,
        totalSpent: 100,
        loyaltyTier: 'green'
      });

      const tierChanged = user.updateLoyaltyTier();

      expect(tierChanged).to.be.true;
      expect(user.loyaltyTier).to.equal('silver');
    });

    it('should update loyalty tier to gold at $500 spent', () => {
      const user = new User({
        role: USER_ROLES.CUSTOMER,
        totalSpent: 500,
        loyaltyTier: 'silver'
      });

      const tierChanged = user.updateLoyaltyTier();

      expect(tierChanged).to.be.true;
      expect(user.loyaltyTier).to.equal('gold');
    });

    it('should update loyalty tier to platinum at $1000 spent', () => {
      const user = new User({
        role: USER_ROLES.CUSTOMER,
        totalSpent: 1000,
        loyaltyTier: 'gold'
      });

      const tierChanged = user.updateLoyaltyTier();

      expect(tierChanged).to.be.true;
      expect(user.loyaltyTier).to.equal('platinum');
    });

    it('should not change tier if already at correct level', () => {
      const user = new User({
        role: USER_ROLES.CUSTOMER,
        totalSpent: 150,
        loyaltyTier: 'silver'
      });

      const tierChanged = user.updateLoyaltyTier();

      expect(tierChanged).to.be.false;
      expect(user.loyaltyTier).to.equal('silver');
    });

    it('should return false for non-customer users', () => {
      const user = new User({
        role: USER_ROLES.STAFF,
        totalSpent: 1000
      });

      const tierChanged = user.updateLoyaltyTier();

      expect(tierChanged).to.be.false;
    });

    // test at threshold
    it('should handle edge cases for tier thresholds', () => {
      const user1 = new User({
        role: USER_ROLES.CUSTOMER,
        totalSpent: 100,
        loyaltyTier: 'green'
      });
      user1.updateLoyaltyTier();
      expect(user1.loyaltyTier).to.equal('silver');

      // test just below threshold
      const user2 = new User({
        role: USER_ROLES.CUSTOMER,
        totalSpent: 99.99,
        loyaltyTier: 'green'
      });
      user2.updateLoyaltyTier();
      expect(user2.loyaltyTier).to.equal('green');

      // test just above threshold
      const user3 = new User({
        role: USER_ROLES.CUSTOMER,
        totalSpent: 100.01,
        loyaltyTier: 'green'
      });
      user3.updateLoyaltyTier();
      expect(user3.loyaltyTier).to.equal('silver');
    });
  });

  describe('addPurchase', () => {
    it('should add purchase amount and update loyalty points', () => {
      const user = new User({
        role: USER_ROLES.CUSTOMER,
        totalSpent: 50,
        loyaltyPoints: 50,
        loyaltyTier: 'green'
      });

      const result = user.addPurchase(75, 75);

      expect(user.totalSpent).to.equal(125);
      expect(user.loyaltyPoints).to.equal(125); // e.g. 50 + 75
      expect(user.loyaltyTier).to.equal('silver'); // should upgrade when it is $100+
      expect(result.tierChanged).to.be.true;
      expect(result.newTier).to.equal('silver');
      expect(result.pointsEarned).to.equal(75);
    });

    it('should handle loyalty discount correctly for originalOrderTotal', () => {
      const user = new User({
        role: USER_ROLES.CUSTOMER,
        totalSpent: 400,
        loyaltyPoints: 400,
        loyaltyTier: 'silver'
      });

      // customer pays $95 but original order was $100 (5% discount applied)
      const result = user.addPurchase(95, 100);

      expect(user.totalSpent).to.equal(495); // adds discounted amount to total spent
      expect(user.loyaltyPoints).to.equal(500); // but earns points on original amount
      expect(user.loyaltyTier).to.equal('gold'); // should upgrade when reach $500+
      expect(result.tierChanged).to.be.true;
      expect(result.pointsEarned).to.equal(100); // points based on original amount $100 and not discounted
    });

    it('should return null for non-customer users', () => {
      const user = new User({
        role: USER_ROLES.STAFF,
        totalSpent: 0,
        loyaltyPoints: 0
      });

      const result = user.addPurchase(100, 100);

      expect(result).to.be.null;
      expect(user.totalSpent).to.equal(0); // should not change
      expect(user.loyaltyPoints).to.equal(0); // should not change
    });

    it('should handle multiple tier upgrades in single purchase', () => {
      const user = new User({
        role: USER_ROLES.CUSTOMER,
        totalSpent: 50,
        loyaltyPoints: 50,
        loyaltyTier: 'green'
      });

      // large purchase that skips silver and goes straight to gold tier
      const result = user.addPurchase(550, 550);

      expect(user.totalSpent).to.equal(600);
      expect(user.loyaltyPoints).to.equal(600);
      expect(user.loyaltyTier).to.equal('gold'); // should skip silver and reach gold
      expect(result.tierChanged).to.be.true;
      expect(result.newTier).to.equal('gold');
    });
  });

  describe('getLoyaltyInfo', () => {
    it('should return correct loyalty info for green tier', () => {
      const user = new User({
        role: USER_ROLES.CUSTOMER,
        totalSpent: 50,
        loyaltyPoints: 50,
        loyaltyTier: 'green'
      });

      const info = user.getLoyaltyInfo();

      expect(info).to.deep.equal({
        currentTier: 'Green',
        discount: 0,
        totalSpent: 50,
        loyaltyPoints: 50,
        nextTier: 'silver',
        nextThreshold: 100,
        amountToNextTier: 50,
        progressToNext: 50 // 50/100 * 100 = 50%
      });
    });

    it('should return correct loyalty info for silver tier', () => {
      const user = new User({
        role: USER_ROLES.CUSTOMER,
        totalSpent: 250,
        loyaltyPoints: 250,
        loyaltyTier: 'silver'
      });

      const info = user.getLoyaltyInfo();

      expect(info).to.deep.equal({
        currentTier: 'Silver',
        discount: 5,
        totalSpent: 250,
        loyaltyPoints: 250,
        nextTier: 'gold',
        nextThreshold: 500,
        amountToNextTier: 250,
        progressToNext: 50 // 250/500 * 100 = 50%
      });
    });

    it('should return correct loyalty info for platinum tier', () => {
      const user = new User({
        role: USER_ROLES.CUSTOMER,
        totalSpent: 1500,
        loyaltyPoints: 1500,
        loyaltyTier: 'platinum'
      });

      const info = user.getLoyaltyInfo();

      expect(info).to.deep.equal({
        currentTier: 'Platinum',
        discount: 15,
        totalSpent: 1500,
        loyaltyPoints: 1500,
        nextTier: null,
        nextThreshold: null,
        amountToNextTier: 0,
        progressToNext: 100 // max tier
      });
    });

    it('should return null for non-customer users', () => {
      const user = new User({
        role: USER_ROLES.STAFF
      });

      const info = user.getLoyaltyInfo();

      expect(info).to.be.null;
    });

    it('should handle progress calculation correctly at tier boundaries', () => {
      // test at exact threshold
      const user1 = new User({
        role: USER_ROLES.CUSTOMER,
        totalSpent: 100,
        loyaltyPoints: 100,
        loyaltyTier: 'silver'
      });

      const info1 = user1.getLoyaltyInfo();
      expect(info1.progressToNext).to.equal(20); // 100/500 * 100 = 20%

      // test close to next threshold
      const user2 = new User({
        role: USER_ROLES.CUSTOMER,
        totalSpent: 450,
        loyaltyPoints: 450,
        loyaltyTier: 'silver'
      });

      const info2 = user2.getLoyaltyInfo();
      expect(info2.progressToNext).to.equal(90); // 450/500 * 100 = 90%
    });
  });
});