const DiscountStrategy = require('../strategies/discountStrategy');

class LoyaltyDiscount extends DiscountStrategy {
    constructor() {
        super('Loyalty Discount', 'Member tier discounts', 15);
        this.tiers = {
            'platinum': 15, //15% off
            'gold': 10, //10% off
            'silver': 5, //5% off
            'green': 0, //0% off
        };
    }

    isEligible(cart, user) {
        return !!(user && user.loyaltyTier && this.tiers[user.loyaltyTier] !== undefined);
    }

    async calculateInCents(cart, user) {
        if (!this.isEligible(cart,user)) {
            return { amountInCents: 0, description: 'Not a member. Become a member now to start earning loyalty rewards.' };
        }

        if (user.loyaltyTier == 'green') {
            return { amountInCents: 0, description: 'Green loyalty status, reach Silver status to get 5% off.'}
        }

        const discountPercent = this.tiers[user.loyaltyTier];
        const subtotalInCents = this.getSubtotalInCents(cart);
        const discountInCents = Math.floor(subtotalInCents * discountPercent / 100);

        return {
            amountInCents: discountInCents,
            description: `${user.loyaltyTier.toUpperCase()} member: ${discountPercent}% off`,
            tier: user.loyaltyTier, 
            discountPercent
        }
    }
}

module.exports = LoyaltyDiscount;