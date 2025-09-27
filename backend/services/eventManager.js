// backend/services/eventManager.js
const EventEmitter = require('events');

class EventEvents extends EventEmitter {}
const eventEvents = new EventEvents();

class EventManager {
  constructor({ EventModel, userModel, defaultCapacity = 0 }) {
    this.Event = EventModel;
    this.User = userModel;
    this.defaultCapacity = defaultCapacity;
  }

  _emitIfFull(eventDoc) {
    if (!eventDoc) return;
    if (eventDoc.capacity > 0 && eventDoc.attendees.length >= eventDoc.capacity) {
      eventEvents.emit('capacity-reached', {
        eventId: eventDoc._id?.toString?.(),
        title: eventDoc.title,
        capacity: eventDoc.capacity,
      });
    }
  }

  // ---- Event CRUD ----
  async createEvent(data, userId) {
    const doc = await this.Event.create({
      ...data,
      createdBy: userId || null,
      capacity: data.capacity || this.defaultCapacity,
    });
    eventEvents.emit('new-event', { id: doc._id.toString(), title: doc.title });
    return doc.toObject();
  }

  async updateEvent(id, updates, userId) {
    const event = await this.Event.findById(id);
    if (!event) throw new Error('Event not found');
    if (event.createdBy?.toString() !== userId.toString()) {
      throw new Error('Forbidden: only the creator can update');
    }
    Object.assign(event, updates);
    const saved = await event.save();
    return saved.toObject();
  }

  async deleteEvent(id, userId) {
    const event = await this.Event.findById(id);
    if (!event) throw new Error('Event not found');
    if (event.createdBy?.toString() !== userId.toString()) {
      throw new Error('Forbidden: only the creator can delete');
    }
    await event.deleteOne();
    eventEvents.emit('event-deleted', { id: id.toString(), title: event.title });
    return { ok: true };
  }

  async listEvents(filter = {}) {
    return this.Event.find(filter).sort({ startAt: 1 }).lean();
  }

  async getEvent(id) {
    const doc = await this.Event.findById(id).lean();
    if (!doc) throw new Error('Event not found');
    return doc;
  }

  // ---- RSVP logic ----
  async rsvpToEvent(id, userId) {
    const event = await this.Event.findById(id);
    if (!event) throw new Error('Event not found');

    const alreadyJoined = event.attendees.some(
      (att) => att.toString() === userId.toString()
    );
    if (alreadyJoined) return event.toObject();

    if (event.capacity > 0 && event.attendees.length >= event.capacity) {
      throw new Error('Event is full');
    }

    event.attendees.push(userId);
    await event.save();

    eventEvents.emit('rsvp', {
      eventId: event._id.toString(),
      userId: userId.toString(),
      attendees: event.attendees.length,
    });

    this._emitIfFull(event);
    return event.toObject();
  }
}

module.exports = {
  EventManager,
  eventEvents,
};
