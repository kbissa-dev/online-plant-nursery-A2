const mongoose = require('mongoose');

const PlantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  image: { type: String, default: 'placeholder.jpg' },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  description: { type: String },
  category: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Plant', PlantSchema);

