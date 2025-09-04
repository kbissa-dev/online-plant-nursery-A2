const PricingService = require('../services/pricingService');

class DiscountStrategy {
    constructor(name, description) {
        this.name = name;
        this.description = description;
    }

    // abstract method for this base class, then apply concrete strategies for various discount logics (child classes)
    async calculate(cart, user) {
        throw new Error('Calculate method must be implemented');
    }

    getTotalItems(cart) {
        return cart.items.reduce((total,item) => total + item.qty, 0);
    }

    getSubtotal(cart) {
        return PricingService.getSubtotalinCents(cart);
    }
}

module.exports = DiscountStrategy;