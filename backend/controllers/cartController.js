const Plant = require('../models/Plant');
const PricingService = require('../services/pricingService');

const calculateCartTotals = async (req, res) => {
  try {
    const { items = [], deliveryFee = 0 } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.json({
        subtotal: "0.00",
        discounts: [],
        totalDiscount: "0.00",
        total: "0.00",
        deliveryFee: "0.00"
      });
    }

    // plants by IDs
    const plantIds = items.map(item => item.plantId);
    const plants = await Plant.find({ _id: { $in: plantIds } }).lean();
    
    if (plants.length !== plantIds.length) {
      return res.status(400).json({ 
        message: 'One or more plants not found' 
      });
    }

    // plant lookup map
    const plantMap = {};
    plants.forEach(plant => {
      plantMap[plant._id.toString()] = plant;
    });

    // cart object for pricing service
    const cartItems = items.map(item => {
      const plant = plantMap[item.plantId];
      const qty = Number(item.qty);
      
      if (!plant) {
        throw new Error(`Plant ${item.plantId} not found`);
      }
      
      if (!Number.isInteger(qty) || qty <= 0) {
        throw new Error(`Invalid quantity for ${plant.name}`);
      }

      return {
        plant: {
          _id: plant._id,
          name: plant.name,
          price: plant.price,
          category: plant.category
        },
        qty: qty
      };
    });

    const cart = { items: cartItems };
    
    // calculate discounts
    const pricing = await PricingService.calculateTotals(cart, req.user);
    
    // add delivery fee
    const deliveryFeeAmount = Number(deliveryFee) || 0;
    const finalTotal = Number(pricing.total) + deliveryFeeAmount;

    res.json({
      subtotal: pricing.subtotal,
      discounts: pricing.discounts,
      totalDiscount: pricing.totalDiscount,
      deliveryFee: deliveryFeeAmount.toFixed(2),
      total: finalTotal.toFixed(2)
    });

  } catch (error) {
    console.error('Cart calculation error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to calculate cart totals' 
    });
  }
};

module.exports = {
  calculateCartTotals
};