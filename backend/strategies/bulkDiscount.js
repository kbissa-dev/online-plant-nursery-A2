const DiscountStrategy = require('./discountStrategy');

class BulkDiscount extends DiscountStrategy {
    constructor() {
        super('Bulk Discount', 'Volume based pricing tiers', 10, 'STACK');
        this.tiers = [
            // avoiding decimals and floating points such as 0.2 to prevent rounding error
            { minQty: 20, discount: 20, label: '20% off 20+ items' },
            { minQty: 10, discount: 10, label: '10% off 10+ items' },
            { minQty: 5, discount: 5, label: '5% off 5+ items' },
        ];
    }

    isEligible(cart, user) {
        return this.getTotalItems(cart) >= 5;
    }

    async calculateInCents(cart, user) {
        if (!this.isEligible(cart, user)) {
            return { amountInCents: 0, description: 'No eligible bulk discount.' };
        }

        const totalItems = this.getTotalItems(cart);
        const discountTier = this.tiers.find(tier => totalItems >= tier.minQty);

        if (!discountTier) {
            return { amountInCents: 0, description: 'No bulk discount applied.'};
        }

        let totalDiscountInCents = 0;

        for (const item of cart.items) {
            const itemPriceInCents = this.dollarsToCents(item.plant.price);
            const itemSubtotalInCents = itemPriceInCents * item.qty;
            const itemDiscountInCents = Math.floor(itemSubtotalInCents * discountTier.discount / 100);
            totalDiscountInCents += itemDiscountInCents;
        }

        return {
            amountInCents: totalDiscountInCents,
            description: `${discountTier.label} (${totalItems} items)`,
            tier: discountTier.minQty,
            discountPercent: discountTier.discount           
        };
    }
}

module.exports = BulkDiscount;