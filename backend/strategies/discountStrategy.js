const PricingService = require('../services/pricingService');

class DiscountStrategy {
    constructor(name, description, priority = 0, combinationRule = 'STACK') {
        if (this.constructor === DiscountStrategy) {
            throw new Error('DiscountStrategy is an abstract - cannot be instantiated');
        }
        // priority creates hierarchy for discount rules, such as the higher priority gets applied first
        // - bigger the number, higher the priority
        // combination rule determine which discounts can be combined
        this.name = name;
        this.description = description;
        this.priority = priority;
        this.combinationRule = combinationRule; // STACK = allow discount to be combined (stacked); BEST_ONLY = compare all discounts of this type and only apply the best one
    }

    // abstract method for this base class
    // then apply concrete strategies for various discount logics (child classes)

    isEligible(cart, user) {
        return false;
    }

    async calculateInCents(cart, user) {
        throw new Error('calculateInCents must be implemented by subclass');
    }

    getTotalItems(cart) {
        return cart.items.reduce((total,item) => total + item.qty, 0);
    }

    getSubtotalInCents(cart) {
        return cart.items.reduce((total, item) => {
            const priceInCents = Math.round(parseFloat(item.plant.price) * 100);
            return total + (priceInCents * item.qty);
        }, 0);
    }
}

module.exports = DiscountStrategy;