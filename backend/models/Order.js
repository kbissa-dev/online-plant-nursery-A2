const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
  name:  { type: String,  required: true },   // snapshot name
  price: { type: Number,  required: true, min: 0 },
  qty:   { type: Number,  required: true, min: 1 }
}, { _id: false });

const OrderSchema = new mongoose.Schema(
  {
    // Items purchased (use the sub-schema so validation actually runs)
    items: { type: [OrderItemSchema], required: true, default: [] },

    // Financials
    subtotal:    { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    total:       { type: Number, default: 0, min: 0 },

    // IMPORTANT: default to 'pending' so your canCancel() shows the button
    status: { 
      type: String, 
      enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'], 
      default: 'pending' 
    },

    // Payment details (note: for null, either drop enum
    // when null, or include null in the allowed values)
    provider:  { type: String, enum: ['stripe', 'paypal'], default: undefined },
    receiptId: { type: String, default: null },
    shipping: { type: Object, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    shippedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    statusHistory: [{
      status: String,
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      updatedAt: { type: Date, default: Date.now },     
    }]
  }, { timestamps: true }
);

// Keep total consistent if caller forgets to send it
OrderSchema.pre('save', function(next) {
  if (this.isModified('subtotal') || this.isModified('deliveryFee') || this.isNew) {
    this.total = Number(this.subtotal || 0) + Number(this.deliveryFee || 0);
  }
  next();
});

// order status tracking
OrderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      updatedAt: new Date()
    });
  } next();
});

// My orders
OrderSchema.index({ createdBy: 1, createdAt: -1 }); // customer order management
OrderSchema.index({ status: 1, createAt: -1 }); // staff order status management

module.exports = mongoose.model('Order', OrderSchema);
