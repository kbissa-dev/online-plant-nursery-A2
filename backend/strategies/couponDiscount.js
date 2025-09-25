const DiscountStrategy = require('./discountStrategy');

class CouponDiscount extends DiscountStrategy {
    constructor() {
        super('Coupon Discount', 'Social media promotions', 3, 'BEST_ONLY');
    }

    isEligible(cart, user) {
        // return false for now since we don't have coupon system implemented yet
        return false;
    }

    async calculateInCents(cart, user) {
        if (!this.isEligible(cart, user)) {
            return { amountInCents: 0, description: 'No coupon applied.' };
        }

        // to add coupon logic here
        return { amountInCents: 0, description: 'No coupon applied.' };
    }
}

module.exports = CouponDiscount;