const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const USER_ROLES = {
  CUSTOMER: 'customer',
  STAFF: 'staff',
  ADMIN: 'admin'
};

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CUSTOMER
    },

    // customer fields
    address: { type: String },
    loyaltyTier: { 
      type: String, 
      enum: ['green', 'silver', 'gold', 'platinum'],
      default: 'green'
    },
    totalSpent: { type: Number, default: 0, min: 0 },
    loyaltyCredit: { type: Number, default: 0, min: 0 }, // for adding discounts given for loyalty tier calculation - higher tier gets higher discounts ends up getting less point if not factored here
    loyaltyPoints: { type: Number, default: 0, min: 0 },

    // employee fields
    employeeId: { type: String, sparse: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Helper for login
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Hide password in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.methods.isCustomer = function() {
  return this.role === USER_ROLES.CUSTOMER;
};

userSchema.methods.isStaff = function() {
  return this.role === USER_ROLES.STAFF;
};

userSchema.methods.isAdmin = function() {
  return this.role === USER_ROLES.ADMIN;
};

userSchema.methods.canManagePlants = function() {
  return this.isStaff() || this.isAdmin();
};

userSchema.methods.canManageUsers = function() {
  return this.isAdmin();
};

userSchema.methods.updateLoyaltyTier = function() {
  if (!this.isCustomer()) return false;

  const previousTier = this.loyaltyTier;
  const loyaltyEligibleAmount = this.totalSpent + this.loyaltyCredit;

  if (loyaltyEligibleAmount >= 1000) {
    this.loyaltyTier = 'platinum';
  } else if (loyaltyEligibleAmount >= 500) {
    this.loyaltyTier = 'gold';
  } else if (loyaltyEligibleAmount >= 100) {
    this.loyaltyTier = 'silver';
  } else {
    this.loyaltyTier = 'green';
  }

  return previousTier !== this.loyaltyTier;
};

// passing in originalOrderTotal so silver, gold, plantinum loyalty members do not loss out on their points
userSchema.methods.addPurchase = function(orderTotal, originalOrderTotal) {
  if (!this.isCustomer()) return null;

  const originalAmount = originalOrderTotal || orderTotal;

  this.totalSpent += orderTotal;
  this.loyaltyCredit += (originalAmount - orderTotal);
  this.loyaltyPoints += Math.floor(originalAmount);
  const tierChanged = this.updateLoyaltyTier();

  return {
    tierChanged,
    newTier: this.loyaltyTier,
    pointsEarned: Math.floor(originalOrderTotal)
  };
};

userSchema.methods.getLoyaltyInfo = function() {
  if (!this.isCustomer()) return null;

  const tiers = {
    'green': { name: 'Green', discount: 0, nextTier: 'silver', nextThreshold: 100 },
    'silver': { name: 'Silver', discount: 5, nextTier: 'gold', nextThreshold: 500 },
    'gold': { name: 'Gold', discount: 10, nextTier: 'platinum', nextThreshold: 1000 },
    'platinum': { name: 'Platinum', discount: 15, nextTier: null, nextThreshold: null }
  };

  const currentTier = tiers[this.loyaltyTier];
  const loyaltyEligibleAmount = this.totalSpent + this.loyaltyCredit;
  const progressToNext = currentTier.nextThreshold ? Math.min(100, (loyaltyEligibleAmount / currentTier.nextThreshold) * 100) : 100;

  return {
    currentTier: currentTier.name,
    discount: currentTier.discount,
    totalSpent: this.totalSpent,
    loyaltyPoints: this.loyaltyPoints,
    nextTier: currentTier.nextTier,
    nextThreshold: currentTier.nextThreshold,
    amountToNextTier: currentTier.nextThreshold ? currentTier.nextThreshold - this.totalSpent : 0,
    progressToNext: progressToNext
  };
};

module.exports = mongoose.model('User', userSchema);
module.exports.USER_ROLES = USER_ROLES;