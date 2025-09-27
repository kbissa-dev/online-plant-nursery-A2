const DiscountStrategy = require('./discountStrategy');

class SeasonalDiscount extends DiscountStrategy {
    // to implement concrete seasonal discount strategies/logic such as shown in bulkDiscount.js
    // included this file to demonstrate possibilities for strategy design pattern

    constructor() {
        super('Seasonal Discount', 'Limited time seasonal promotion', 5);
    }

    isEligible(cart, user) {
        const currentMonth = new Date().getMonth() + 1;
        
        // spring promotion
        const isSpring = currentMonth >= 9 && currentMonth <= 11;
        if (!isSpring) return false;

        return cart.items.some(item => 
            item.plant.category && item.plant.category.toLowerCase().includes('outdoor')
        );

        // summer promotion
        // const isSummer = currentMonth = 12 && currentMonth <= 2;
        // if (!isSummer) return false;

        // autumn promotion
        // const isAutumn = currentMonth >= 3 && currentMonth <= 5;
        // if (!isAutumn) return false;

        // // winter promotion
        // const isWinter = currentMonth >= 6 && currentMonth <= 8;
        // if (!isWinter) return false;
    }

    async calculateInCents(cart, user) {
        if (!this.isEligible(cart, user)) {
            return { amountInCents: 0, description: 'No eligible seasonal promotion.'};
        }

        let discountInCents = 0;
        const outdoorItems = cart.items.filter(item => 
            item.plant.category && item.plant.category.toLowerCase().includes('outdoor')
        );

        for (const item of outdoorItems) {
            const itemPriceInCents = this.dollarsToCents(item.plant.price); // Fixed: use this.dollarsToCents
            const itemSubtotal = itemPriceInCents * item.qty;
            discountInCents += Math.floor(itemSubtotal * 15 / 100);
        }

        return {
            amountInCents: discountInCents,
            description: `Spring Promotion: 15% off outdoor plants`,
            itemsAffected: outdoorItems.length
        };
    }
}

module.exports = SeasonalDiscount;