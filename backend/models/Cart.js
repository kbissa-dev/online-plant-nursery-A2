const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        plant: {type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
        qty: {type: Number, required: true, min: 1 }
    }]
}, { timestamps: true });

//only 1 cart per user
CartSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('Cart', CartSchema);