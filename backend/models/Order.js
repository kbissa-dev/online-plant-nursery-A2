const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
  name: { type: String, required: true },   // snapshot name at time of order
  price: { type: Number, required: true },  // snapshot price at time of order
  qty:   { type: Number, required: true, min: 1 }
}, { _id: false });

const OrderSchema = new mongoose.Schema(
  {
    // Array of purchased items in this order
    items: [
      {
        name: String, // snapshot of plant name at time of order
        plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }, // reference to Plant collection
        price: Number, // unit price at time of order
        qty: Number,   // quantity ordered
      }
    ],

    // Financials 
    subtotal: Number,   // sum of item.price * qty
    deliveryFee: Number, // delivery fee applied
    total: Number,       // subtotal + deliveryFee
    status: { type: String, default: 'paid' },  // order status (paid, penidng, refunded, etc.)

    // Payment setails (added for Adapter pattern demo)
    provider: { type: String, enum: ['stripe', 'paypal'], default: null },  // which gateway was used
    receiptId: { type: String, default: null },  // confirmation/transaction id from provider
    
    // Shipping details 
    shipping: Object,  // hold address, courier, etc.

    // User reference
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }  // auto-adds createdAt and updatedAt
);

module.exports = mongoose.model('Order', OrderSchema);
