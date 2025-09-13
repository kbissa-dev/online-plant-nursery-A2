const BaseOrder = require("../decorators/baseOrder");
const GiftWrapDecorator = require("../decorators/giftWrapDecorator");

exports.createOrder = async (req, res) => {
  try {
    let order = new BaseOrder(req.body);

    if (req.body.giftWrap) {
      order = new GiftWrapDecorator(order);
    }

    res.json({
      description: order.getDescription(),
      total: order.getCost()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
