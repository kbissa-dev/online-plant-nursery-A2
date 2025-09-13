const PricingService = require('../services/pricingService');
const DiscountStrategy = require('./discountStrategy');

class BulkDiscount extends DiscountStrategy {
    constructor() {
        super('Bulk Discount', 'Volume based pricing tiers');
        this.tiers = [
            //avoiding decimals and floating points such as 0.2 to prevent rounding error
            { minQty: 20, discount: 2000, label: '20% off 20+ items' },
            { minQty: 10, discount: 1000, label: '10% off 10+ items' },
            { minQty: 5, discount: 500, label: '5% off 5+ items' },
        ];
    }

    async calculate(cart, user) {
        const totalItems = this.getTotalItems(cart);

        const discountTier = this.tiers.find(tier => totalItems >= tier.minQty);

        if (!discountTier) {
            return { amountCents: 0, description: 'No bulk discount applied' };
        }

        let totalDiscountInCents = 0;

        for (const item of cart.items) {
            const itemPriceInCents = PricingService.dollarsToCents(item.plant.price);
            const itemSubtotalInCents = itemPriceInCents * item.qty;

            const itemDiscountInCents = itemSubtotalInCents * discountTeir.discount;
            totalDiscountInCents += itemDiscountInCents;
        }
        
        return {
            amountInCents: totalDiscountInCents,
            description: `${discountTier.label} (${totalItems} items)`,
            tier: discountTier.minQty
        };

    }

}

module.exports = BulkDiscount;