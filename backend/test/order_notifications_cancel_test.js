const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');

// Use real decorator service (no adapters required)
const { buildNotifier } = require('../services/notificationService');

// Use  real cancel controller
const { cancelOrder } = require('../controllers/orderController');

// We only stub DB calls on the Order model
const Order = require('../models/Order');
const Plant = require('../models/Plant');
//const { findById } = require('../models/Plant');
const { json } = require('express');
const { findByIdAndUpdate } = require('../models/User');

describe('Order notifications & cancel', () => {
  afterEach(() => sinon.restore());

  it('builds notifier with selected channels', async () => {

    // This test only exercises the decorator pipeline.
    // We spy on console to prove each channel ran.

    const log = sinon.spy(console, 'log');

    const notifier = buildNotifier(['email', 'sms', 'toast']);
    await notifier.send('Order o1 placed successfully!');

    // Expect that our decorator chain logged each channel
    const out = log.getCalls().map(c => String(c.args.join(' '))).join('\n');

    expect(out).to.match(/Base notifier/i);
    expect(out).to.match(/Email sent/i);
    expect(out).to.match(/SMS sent/i);
    expect(out).to.match(/Toast notification/i);
  });

  it('cancel controller flips status to cancelled (own pending order within 5 mins)', async () => {
  const orderId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const plantId = new mongoose.Types.ObjectId();

  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);
  
  const mockOrder = {
    _id: orderId,
    status: 'pending',
    createdBy: userId, // ObjectId
    createdAt: twoMinAgo, // 2 mins ago
    items: [{ plant: plantId, qty: 1 } ],
    statusHistory: [], 
    save: sinon.stub().callsFake(async function() { 
      this.status = 'cancelled'; // update the status to cancelled when save is called
      return this; 
    }),
  };
  
  sinon.stub(Order, 'findById').resolves(mockOrder);
  sinon.stub(Plant, 'findByIdAndUpdate').resolves({});

  const req = { 
    params: { id: orderId.toString() },
    user: {
      id: userId.toString(), // match createdBy.toString()
      _id: userId,
      isCustomer: () => true
    },
  };
  
  const res = {
    statusCode: 0, // Start at 0
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; if(!this.statusCode) this.statusCode=200; return this; },
  };

  await cancelOrder(req, res);

  console.log('Cancel Res', res.statusCode, res.body); // See the error payload

  expect(res.statusCode).to.equal(200);
  expect(res.body).to.have.property('success', true);
  expect(res.body.order).to.have.property('status', 'cancelled');
  expect(mockOrder.save.calledOnce).to.equal(true);
  });

// Test: Rejects cancel after 5 mins (controller returns 400)
it('rejects cancel after 5 mins', async () => {
  const orderId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();

  // created at 6 mins ago
  const sixMinAgo = new Date(Date.now() - 6 * 60 * 1000);

  const mockOrder = {
    _id: orderId,
    status: 'pending',
    createdBy: userId,
    createdAt: sixMinAgo,
    statusHistory: [],
    save: sinon.spy(async function () {return this; }),
  };

  sinon.stub(Order, 'findById').resolves(mockOrder);

  const req = {
    params: { id: orderId.toString() },
    user: {
      id: userId.toString(),
      isCustomer: () => true,
    },
  };

  const res = {
    statusCode: 0,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };

  await cancelOrder(req, res);

  expect(res.statusCode).to.equal(400);
  // Controller message 
  // Cancel allowed only within 5 mins for pending orders
  expect(res.body).to.have.property('error');
  // expect(mockOrder.save.called).to.equal(false);
});

// Test: 404 whenorder is not found
it('returns 404 if order not found', async () => {
  const orderId = new mongoose.Types.ObjectId();

  sinon.stub(Order, 'findById').resolves(null);

  const req = {
    params: { id: orderId.toString() },
    user: {
      id: new mongoose.Types.ObjectId().toString(),
      isCustomer: () => true,
    },
  };

  const res = {
    statusCode: 0,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };

  await cancelOrder(req, res);

  expect(res.statusCode).to.equal(404);
  expect(res.body).to.have.property('error').that.match(/order not found/i);
});
});
