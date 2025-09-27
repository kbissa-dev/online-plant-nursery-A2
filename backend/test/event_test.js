// backend/test/event_test.js

const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');

const Event = require('../models/Event');
const User = require('../models/User');
const eventController = require('../controllers/eventController');

const { expect } = chai;

describe('Community Events Controller Tests', () => {
  afterEach(() => sinon.restore());

  // ---- Create Event ----
  describe('createEvent', () => {
    it('should create a new event successfully', async () => {
      const req = {
        user: { _id: new mongoose.Types.ObjectId() },
        body: { title: 'Hackathon', date: new Date(), location: 'QUT', attendees: [] }
      };
      const createdEvent = { _id: new mongoose.Types.ObjectId(), ...req.body, createdBy: req.user._id };

      // Stub manager instead of Event
      sinon.stub(eventController.__manager, 'createEvent').resolves(createdEvent);

      const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

      await eventController.createEvent(req, res);

      expect(res.status.calledWith(201)).to.be.true;
      const response = res.json.firstCall.args[0];
      expect(response).to.include.keys(['id', 'title', 'date', 'location', 'isFeatured']);
    });

    it('should return 400 if create fails', async () => {
      const req = { user: { _id: new mongoose.Types.ObjectId() }, body: { title: 'Bad Event' } };
      const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

      sinon.stub(eventController.__manager, 'createEvent').throws(new Error('DB Error'));

      await eventController.createEvent(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
    });
  });

  // ---- List Events ----
  describe('listEvents', () => {
    it('should return a decorated list of events', async () => {
      const events = [
        { _id: new mongoose.Types.ObjectId(), title: 'Hackathon', date: new Date(), location: 'QUT', attendees: [] }
      ];

      sinon.stub(eventController.__manager, 'listEvents').resolves(events);

      const req = {};
      const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

      await eventController.listEvents(req, res);

      const response = res.json.firstCall.args[0];
      expect(response[0]).to.include.keys(['id', 'title', 'date', 'location', 'isFeatured']);
    });

    it('should return 400 on error', async () => {
      sinon.stub(eventController.__manager, 'listEvents').throws(new Error('DB Error'));

      const req = {};
      const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

      await eventController.listEvents(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
    });
  });

  // ---- Get Event ----
  describe('getEvent', () => {
    it('should return decorated event detail', async () => {
      const event = { _id: new mongoose.Types.ObjectId(), title: 'Seminar', date: new Date(), location: 'Brisbane', attendees: [] };
      sinon.stub(eventController.__manager, 'getEvent').resolves(event);

      const req = { params: { id: event._id.toString() } };
      const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

      await eventController.getEvent(req, res);

      const response = res.json.firstCall.args[0];
      expect(response).to.include.keys(['id', 'title', 'date', 'location', 'isFeatured']);
    });

    it('should return 404 if event not found', async () => {
      sinon.stub(eventController.__manager, 'getEvent').throws(new Error('Event not found'));

      const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
      const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

      await eventController.getEvent(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'Event not found' })).to.be.true;
    });
  });

  // ---- Update Event ----
  describe('updateEvent', () => {
    it('should update event successfully', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const updated = { _id: id, title: 'Updated Title', date: new Date(), location: 'QUT', attendees: [] };

      sinon.stub(eventController.__manager, 'updateEvent').resolves(updated);

      const req = { params: { id }, body: { title: 'Updated Title' }, user: { _id: id } };
      const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

      await eventController.updateEvent(req, res);

      const response = res.json.firstCall.args[0];
      expect(response).to.include.keys(['id', 'title', 'date', 'location', 'isFeatured']);
    });

    it('should return 400 if update fails', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      sinon.stub(eventController.__manager, 'updateEvent').throws(new Error('DB Error'));

      const req = { params: { id }, body: {}, user: { _id: id } };
      const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

      await eventController.updateEvent(req, res);

      expect(res.status.calledWith(400)).to.be.true;
    });
  });

  // ---- Delete Event ----
  describe('deleteEvent', () => {
    it('should delete event successfully', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      sinon.stub(eventController.__manager, 'deleteEvent').resolves({ ok: true });

      const req = { params: { id }, user: { _id: id } };
      const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

      await eventController.deleteEvent(req, res);

      expect(res.json.calledWith({ ok: true })).to.be.true;
    });

    it('should return 400 if delete fails', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      sinon.stub(eventController.__manager, 'deleteEvent').throws(new Error('DB Error'));

      const req = { params: { id }, user: { _id: id } };
      const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

      await eventController.deleteEvent(req, res);

      expect(res.status.calledWith(400)).to.be.true;
    });
  });

  // ---- RSVP Event ----
  describe('rsvpEvent', () => {
    it('should RSVP successfully', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const event = { _id: id, attendees: [userId], title: 'Test', date: new Date(), location: 'QUT' };

      sinon.stub(eventController.__manager, 'rsvpToEvent').resolves(event);

      const req = { params: { id }, user: { _id: userId } };
      const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

      await eventController.rsvpEvent(req, res);

      const response = res.json.firstCall.args[0];
      expect(response).to.include.keys(['id', 'title', 'date', 'location', 'isFeatured']);
    });

    it('should return 400 if RSVP fails', async () => {
      sinon.stub(eventController.__manager, 'rsvpToEvent').throws(new Error('DB Error'));

      const req = { params: { id: new mongoose.Types.ObjectId().toString() }, user: { _id: new mongoose.Types.ObjectId() } };
      const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

      await eventController.rsvpEvent(req, res);

      expect(res.status.calledWith(400)).to.be.true;
    });
  });
});