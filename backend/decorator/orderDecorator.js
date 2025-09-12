class OrderDecorator {
  constructor(order) {
    this.order = order;
  }

  getDescription() {
    return this.order.getDescription();
  }

  getCost() {
    return this.order.getCost();
  }
}

module.exports = OrderDecorator;
