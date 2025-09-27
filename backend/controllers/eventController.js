// backend/controllers/eventController.js
const { EventManager } = require('../services/eventManager');
const Event = require('../models/Event');
const User = require('../models/User'); 
const EventDecorator = require('../decorator/eventDecorator');

// Initialize manager with Mongoose models
const manager = new EventManager({
  EventModel: Event,
  userModel: User,
  defaultCapacity: 50, // can be adjusted
});

// Normalize to plain object before decorating
function normalize(doc) {
  return doc?.toObject ? doc.toObject() : doc;
}

// ---- Event CRUD ----
exports.createEvent = async (req, res) => {
  try {
    const userId = req.user?._id; // assuming auth middleware sets req.user
    const event = await manager.createEvent(req.body, userId);
    const decorated = new EventDecorator(normalize(event)).formatForCommunityFeed();
    res.status(201).json(decorated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const userId = req.user?._id;
    const updated = await manager.updateEvent(req.params.id, req.body, userId);
    const decorated = new EventDecorator(normalize(updated)).formatForCommunityFeed();
    res.json(decorated);
  } catch (err) {
    if (err.message.startsWith('Forbidden')) {
      res.status(403).json({ message: err.message });
    } else {
      res.status(400).json({ message: err.message });
    }
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const userId = req.user?._id;
    const result = await manager.deleteEvent(req.params.id, userId);
    res.json(result);
  } catch (err) {
    if (err.message.startsWith('Forbidden')) {
      res.status(403).json({ message: err.message });
    } else {
      res.status(400).json({ message: err.message });
    }
  }
};

// ---- Event Fetch ----
exports.listEvents = async (req, res) => {
  try {
    const events = await manager.listEvents(req.query);
    const decorated = events.map(e => new EventDecorator(normalize(e)).formatForCommunityFeed());
    res.json(decorated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getEvent = async (req, res) => {
  try {
    const event = await manager.getEvent(req.params.id);
    const decorated = new EventDecorator(normalize(event)).formatForCommunityFeed();
    res.json(decorated);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// ---- RSVP ----
exports.rsvpEvent = async (req, res) => {
  try {
    const userId = req.user?._id;
    const event = await manager.rsvpToEvent(req.params.id, userId);
    const decorated = new EventDecorator(normalize(event)).formatForCommunityFeed();
    res.json(decorated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Expose the EventManager instance for tests
module.exports.__manager = manager;