class PricingService {
    static async calculateTotals(cart, user) {
        if (!cart || !cart.items.length) {
            return {
                subtotalInCents: 0,
                discounts: [],
                totalDiscountInCents: 0,
                totalInCents: 0,
                // displaying value
                subtotal: "0.00",
                totalDiscount: "0.00",
                total: "0.00"
            };
        }
        
        const subtotalInCents = cart.items.reduce((total, item) => total + (this.dollarsToCents(item.plant.price) * item.qty), 0);
        
        const strategies = DiscountStrategyFactory.create(user, cart);
        const discountResults = [];
        let totalDiscountInCents = 0;

        for (const strategy of strategies) {
            try {
                const result = await strategy.calculateInCents(cart, user);
                if (result.amountCents > 0) {
                    discountResults.push({
                        name: strategy.name,
                        amountCents: result.amountCents,
                        amount: this.centsToDollars(result.amountCents),
                        description: result.description,
                        ...result
                    });
                    totalDiscountInCents += result.amountCents;
                }
            } catch (error) {
                console.error(`Error applying ${strategy.name}:`, error);
            }
        }

        const totalInCents = Math.max(0, subtotalInCents - totalDiscountInCents);
        return {
            subtotalInCents,
            totalDiscountInCents,
            totalInCents,
            discounts: discountResults,
            // displaying value
            subtotal: this.centsToDollars(subtotalInCents),
            totalDiscount: this.centsToDollars(totalDiscountInCents),
            total: this.centsToDollars(totalInCents)
        };
    }

    static dollarsToCents(dollars) {
        return Math.round(parseFloat(dollars) * 100);
    }

    static centsToDollars(cents) {
        return (cents / 100).toFixed(2);
    }

    static getSubtotalinCents(cart) {
        return cart.items.reduce((total, item) => total + (this.dollarsToCents(item.plant.price) * item.qty), 0);
    }
}

module.exports = PricingService;