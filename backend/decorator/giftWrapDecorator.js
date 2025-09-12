const OrderDecorator = require("./orderDecorator");

class GiftWrapDecorator extends OrderDecorator {
  getDescription() {
    return this.order.getDescription() + ", with gift wrapping";
  }

  getCost() {
    return this.order.getCost() + 5; // add $5 for gift wrap
  }
}

module.exports = GiftWrapDecorator;
