const BulkDiscount = require('../strategies/bulkDiscount');
const LoyaltyDiscount = require('../strategies/loyaltyDiscount');
const SeasonalDiscount = require('../strategies/seasonalDiscount');
const CouponDiscount = require('../strategies/couponDiscount');

class DiscountStrategyFactory {
    static create(user, cart) {
        return [
            new BulkDiscount(),
            new LoyaltyDiscount(),
            new SeasonalDiscount(),
            new CouponDiscount(),
        ];
    }
}

module.exports = DiscountStrategyFactory;