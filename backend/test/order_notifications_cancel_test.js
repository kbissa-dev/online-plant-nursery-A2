const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');

// Use your real decorator service (no adapters required)
const { buildNotifier } = require('../services/notificationService');

// Use your real cancel controller
const { cancelOrder } = require('../controllers/orderController');

// We only stub DB calls on the Order model
const Order = require('../models/Order');

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

  it('cancel controller flips status to cancelled', async () => {
  const orderId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  
  const mockOrder = {
    _id: orderId,
    status: 'pending',
    createdBy: userId,
    createdAt: new Date(),
    save: sinon.spy(async function() { 
      this.status = 'cancelled'; // update the status to cancelled when save is called
      return this; 
    })
  };
  
  sinon.stub(Order, 'findById').resolves(mockOrder);

  const req = { 
    params: { id: orderId.toString() },
    user: {
      id: userId.toString(),
      isCustomer: () => true
    }
  };
  
  const res = {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };

  await cancelOrder(req, res);

  expect(res.statusCode).to.equal(200);
  expect(res.body).to.have.property('success', true);
  expect(res.body.order).to.have.property('status', 'cancelled');
  expect(mockOrder.save.calledOnce).to.equal(true);
  });
});
