class BaseOrder {
  constructor(order) {
    this.order = order;  // original order object
  }

  getDescription() {
    return "Order with basic items";
  }

  getCost() {
    return this.order.total; // base price
  }
}

module.exports = BaseOrder;
