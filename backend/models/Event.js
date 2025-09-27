// backend/models/Event.js
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: String,
  category: { type: String, default: 'Community' },
  city: { type: String, enum: ["Sydney", "Melbourne", "Brisbane"], required: true },
  location: { type: String, required: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  capacity: { type: Number, default: 0, min: 0 },
  isOnline: { type: Boolean, default: false },
  price: { type: Number, default: 0, min: 0 }, // 0 = free
  tags: [{ type: String, trim: true }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);


