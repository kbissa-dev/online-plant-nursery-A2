// backend/test/event_test.js
const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');

const eventController = require('../controllers/eventController');
const EventDecorator = require('../decorator/eventDecorator'); 
const { expect } = chai;

describe('Community Events Controller Functional Tests (CRUD)', () => {
  afterEach(() => sinon.restore());

  // ---- Create Event ----
  describe('createEvent', () => {
    it('T001 - should create a new event successfully', async () => {
      const req = {
        user: { _id: new mongoose.Types.ObjectId() },
        body: { title: 'Hackathon', date: new Date(), location: 'QUT' }
      };
      const createdEvent = { _id: new mongoose.Types.ObjectId(), ...req.body };

      sinon.stub(eventController.__manager, 'createEvent').resolves(createdEvent);

      // Decorator to control output
      sinon.stub(EventDecorator.prototype, 'formatForCommunityFeed')
        .returns({ id: createdEvent._id, title: 'Hackathon', date: req.body.date, location: 'QUT' });

      const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };
      await eventController.createEvent(req, res);

      expect(res.status.calledWith(201)).to.be.true;
      const response = res.json.firstCall.args[0];
      expect(response).to.include.keys(['id', 'title', 'date', 'location']);
    });

    it('T002 - should not create event without title', async () => {
      const req = { user: { _id: new mongoose.Types.ObjectId() }, body: {} };
      const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

      sinon.stub(eventController.__manager, 'createEvent').throws(new Error('Title required'));

      await eventController.createEvent(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'Title required' })).to.be.true;
    });

    it('T003 - should not allow duplicate event creation', async () => {
      const req = { user: { _id: new mongoose.Types.ObjectId() }, body: { title: 'Hackathon' } };
      const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

      sinon.stub(eventController.__manager, 'createEvent').throws(new Error('Duplicate event'));

      await eventController.createEvent(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'Duplicate event' })).to.be.true;
    });
  });

  // ---- Update Event ----
  describe('updateEvent', () => {
    it('T004 - should update event successfully', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const updated = { _id: id, title: 'Updated Title', date: new Date(), location: 'QUT' };

      sinon.stub(eventController.__manager, 'updateEvent').resolves(updated);

      // Decorator to control output
      sinon.stub(EventDecorator.prototype, 'formatForCommunityFeed')
        .returns({ id, title: 'Updated Title', date: updated.date, location: 'QUT' });

      const req = { params: { id }, body: { title: 'Updated Title' }, user: { _id: id } };
      const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

      await eventController.updateEvent(req, res);

      const response = res.json.firstCall.args[0];
      expect(response).to.include.keys(['id', 'title', 'date', 'location']);
      expect(response.title).to.equal('Updated Title');
    });

    it('T005 - should reject invalid update input', async () => {
      const id = 'bad-id';
      sinon.stub(eventController.__manager, 'updateEvent').throws(new Error('Invalid ID'));

      const req = { params: { id }, body: {}, user: { _id: id } };
      const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

      await eventController.updateEvent(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'Invalid ID' })).to.be.true;
    });
  });

  // ---- Delete Event ----
  describe('deleteEvent', () => {
    it('T006 - should delete event successfully', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      sinon.stub(eventController.__manager, 'deleteEvent').resolves({ message: 'Event deleted' });

      const req = { params: { id }, user: { _id: id } };
      const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

      await eventController.deleteEvent(req, res);

      expect(res.json.calledWith({ message: 'Event deleted' })).to.be.true;
    });

    it('T007 - should block deletion of non-existent event', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      sinon.stub(eventController.__manager, 'deleteEvent').throws(new Error('Event not found'));

      const req = { params: { id }, user: { _id: id } };
      const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

      await eventController.deleteEvent(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'Event not found' })).to.be.true;
    });
  });

  // ---- List Events ----
  describe('listEvents', () => {
    it('T008 - should display list of all events correctly', async () => {
      const events = [
        { _id: new mongoose.Types.ObjectId(), title: 'Hackathon', date: new Date(), location: 'QUT' }
      ];
      sinon.stub(eventController.__manager, 'listEvents').resolves(events);

      // Decorator so output is predictable
      sinon.stub(EventDecorator.prototype, 'formatForCommunityFeed')
        .returns({ id: events[0]._id, title: 'Hackathon', date: events[0].date, location: 'QUT' });

      const req = {};
      const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

      await eventController.listEvents(req, res);

      expect(res.json.calledOnce).to.be.true;
      const response = res.json.firstCall.args[0];
      expect(response[0]).to.include.keys(['id', 'title', 'date', 'location']);
    });
  });
});
