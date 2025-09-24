const mongoose = require('mongoose');
const Counter = require('./Counter');

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

    // Important: default to 'pending' so canCancel() shows the button
    status: { 
      type: String, 
      enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'], 
      default: 'pending' 
    },

    orderNumber: { type: Number, unique: true, index: true },

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

// assign next orderNumber on first save
OrderSchema.pre('save', async function (next) {
  if(!this.isNew || this.orderNumber) return next();
  try{
    const c = await Counter.findByIdAndUpdate(
      {_id: 'orders'},
      { $inc: {seq: 1} },
      { new: true, upsert: true },
    );
    this.orderNumber = c.seq;
    next();
  }
  catch(err){
    next(err);
  } 
});
// Track status history
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
OrderSchema.index({ status: 1, createdAt: -1 }); // staff order status management

module.exports = mongoose.model('Order', OrderSchema);
