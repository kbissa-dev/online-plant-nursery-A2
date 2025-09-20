// backend/test/example_test.js

// OPNS-41/45/46: PR evidence
// OPNS-41/45/46: evidence commit, 25 tests passing

const chai = require('chai');
const chaiHttp = require('chai-http');
const http = require('http'); 
const app = require('../server'); 
const connectDB = require('../config/db'); 
const mongoose = require('mongoose');
const sinon = require('sinon');

const Plant = require('../models/Plant');
const Order = require('../models/Order');

const {
  addPlant, getPlants, updatePlant, deletePlant
} = require('../controllers/plantController');

const {
  addOrder, getOrders, updateOrder, deleteOrder
} = require('../controllers/orderController');

const { expect } = chai;
chai.use(chaiHttp);

let server; 
let port;   

 // Plant Controller Tests
describe('AddPlant Function Test', () => {

  it('should create a new plant successfully', async () => {
    const req = {
      user: { id: new mongoose.Types.ObjectId() },
      body: { name: 'Monstera', price: 24.99, stock: 10, category: 'Indoor', description: 'Nice' }
    };

    const createdPlant = { _id: new mongoose.Types.ObjectId(), ...req.body, createdBy: req.user.id };

    const createStub = sinon.stub(Plant, 'create').resolves(createdPlant);

    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await addPlant(req, res);

    expect(createStub.calledOnceWith({
      name: req.body.name,
      price: req.body.price,
      stock: req.body.stock,
      description: req.body.description,
      category: req.body.category,
      createdBy: req.user.id
    })).to.be.true;
    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWith(createdPlant)).to.be.true;

    createStub.restore();
  });

  it('should return 500 if an error occurs', async () => {
    const createStub = sinon.stub(Plant, 'create').throws(new Error('DB Error'));
    const req = { user: { id: new mongoose.Types.ObjectId() }, body: { name: 'X', price: 1 } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await addPlant(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;

    createStub.restore();
  });

});


describe('UpdatePlant Function Test', () => {
    
  it('should update plant successfully', async () => {
    const plantId = new mongoose.Types.ObjectId().toString();
    const updatedPlant = { _id: plantId, name: 'New Name', price: 9.99, stock: 3 };

    const findByIdAndUpdateStub = sinon.stub(Plant, 'findByIdAndUpdate').resolves(updatedPlant);

    const req = { params: { id: plantId }, body: { name: 'New Name' } };
    const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

    await updatePlant(req, res);

    expect(findByIdAndUpdateStub.calledOnce).to.be.true;
    expect(res.status.called).to.be.false;
    expect(res.json.calledOnceWith(updatedPlant)).to.be.true;

    findByIdAndUpdateStub.restore();
  });

  it('should return 404 if plant is not found', async () => {
    const plantId = new mongoose.Types.ObjectId().toString();
    const findByIdAndUpdateStub = sinon.stub(Plant, 'findByIdAndUpdate').resolves(null);

    const req = { params: { id: plantId }, body: {} };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await updatePlant(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Plant not found' })).to.be.true;

    findByIdAndUpdateStub.restore();
  });

  it('should return 400 on invalid id', async () => {
    const req = { params: { id: 'bad-id' }, body: {} };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await updatePlant(req, res);

    expect(res.status.calledWith(400)).to.be.true;
  });

  it('should return 500 on error', async () => {
    const plantId = new mongoose.Types.ObjectId().toString();
    const findByIdAndUpdateStub = sinon.stub(Plant, 'findByIdAndUpdate').throws(new Error('DB Error'));

    const req = { params: { id: plantId }, body: {} };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await updatePlant(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.called).to.be.true;

    findByIdAndUpdateStub.restore();
  });

});


describe('GetPlant Function Test', () => {

  it('should return plants list', async () => {
    const plants = [{ _id: new mongoose.Types.ObjectId(), name: 'A', price: 1 }];
    const findStub = sinon.stub(Plant, 'find').returns({ lean: () => Promise.resolve(plants) });

    const req = {};
    const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

    await getPlants(req, res);

    expect(findStub.calledOnce).to.be.true;
    expect(res.json.calledWith(plants)).to.be.true;
    expect(res.status.called).to.be.false;

    findStub.restore();
  });

  it('should return 500 on error', async () => {
    const findStub = sinon.stub(Plant, 'find').returns({ lean: () => { throw new Error('DB Error'); } });

    const req = {};
    const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

    await getPlants(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;

    findStub.restore();
  });

});


describe('DeletePlant Function Test', () => {

  it('should delete a plant successfully', async () => {
    const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
    const findByIdAndDeleteStub = sinon.stub(Plant, 'findByIdAndDelete').resolves({ _id: req.params.id });

    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await deletePlant(req, res);

    expect(findByIdAndDeleteStub.calledOnceWith(req.params.id)).to.be.true;
    expect(res.json.calledWith({ message: 'Plant deleted successfully' })).to.be.true;

    findByIdAndDeleteStub.restore();
  });

  it('should return 404 if plant is not found', async () => {
    const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
    const findByIdAndDeleteStub = sinon.stub(Plant, 'findByIdAndDelete').resolves(null);

    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await deletePlant(req, res);

    expect(findByIdAndDeleteStub.calledOnceWith(req.params.id)).to.be.true;
    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Plant not found' })).to.be.true;

    findByIdAndDeleteStub.restore();
  });

  it('should return 400 on invalid id', async () => {
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };
    await deletePlant({ params: { id: 'bad' } }, res);
    expect(res.status.calledWith(400)).to.be.true;
  });

  it('should return 500 if an error occurs', async () => {
    const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
    const findByIdAndDeleteStub = sinon.stub(Plant, 'findByIdAndDelete').throws(new Error('DB Error'));

    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await deletePlant(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;

    findByIdAndDeleteStub.restore();
  });

});

 // Order Controller Tests
describe('AddOrder Function Test', () => {

  it('should create an order with snapshot items', async () => {
    const p1 = { _id: new mongoose.Types.ObjectId(), name: 'Aloe', price: 10 };
    const p2 = { _id: new mongoose.Types.ObjectId(), name: 'Fern', price: 7.5 };

    // controller: Plant.find(...).lean()
    const plantFindStub = sinon.stub(Plant, 'find').returns({ lean: () => Promise.resolve([p1, p2]) });

    const req = {
      user: { id: new mongoose.Types.ObjectId() },
      body: { items: [{ plant: String(p1._id), qty: 2 }, { plant: String(p2._id), qty: 1 }], deliveryFee: 5 }
    };

    const createdOrder = {
      _id: new mongoose.Types.ObjectId(),
      items: [
        { plant: p1._id, name: p1.name, price: p1.price, qty: 2 },
        { plant: p2._id, name: p2.name, price: p2.price, qty: 1 },
      ],
      subtotal: 27.5, deliveryFee: 5, total: 32.5, createdBy: req.user.id
    };

    const orderCreateStub = sinon.stub(Order, 'create').resolves(createdOrder);

    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await addOrder(req, res);

    expect(plantFindStub.calledOnce).to.be.true;
    expect(orderCreateStub.calledOnce).to.be.true;
    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWith(createdOrder)).to.be.true;

    plantFindStub.restore();
    orderCreateStub.restore();
  });

  it('should return 400 if items missing', async () => {
    const req = { body: { items: [] } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };
    await addOrder(req, res);
    expect(res.status.calledWith(400)).to.be.true;
  });

  it('should return 500 on error', async () => {
    const plantFindStub = sinon.stub(Plant, 'find').returns({ lean: () => { throw new Error('DB Error'); } });
    const req = { body: { items: [{ plant: new mongoose.Types.ObjectId().toString(), qty: 1 }] } };
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };
    await addOrder(req, res);
    expect(res.status.calledWith(500)).to.be.true;
    plantFindStub.restore();
  });

});


describe('GetOrder Function Test', () => {

  it('should return orders (sorted, lean)', async () => {
    const orders = [{ _id: new mongoose.Types.ObjectId(), subtotal: 10, deliveryFee: 0, total: 10, createdAt: new Date() }];
    
    const findStub = sinon.stub(Order, 'find').returns({
      populate: () => ({
        populate: () => ({
          populate: () => ({
            sort: () => ({
              lean: () => Promise.resolve(orders)
            })
          })
        })
      })
    });

    const req = { 
      user: { 
        id: new mongoose.Types.ObjectId(),
        isCustomer: sinon.stub().returns(true)
      } 
    };
    const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

    await getOrders(req, res);

    expect(findStub.calledOnce).to.be.true;
    expect(res.json.calledWith(orders)).to.be.true;
    expect(res.status.called).to.be.false;

    findStub.restore();
  });
});

describe('UpdateOrder Function Test', () => {
  afterEach(() => sinon.restore());

  it('should return 403 when customer tries to update deliveryFee', async () => {
  const id = new mongoose.Types.ObjectId().toString();
  const current = { _id: id, subtotal: 20, deliveryFee: 0, total: 20, createdBy: new mongoose.Types.ObjectId() };

  const findByIdStub = sinon.stub(Order, 'findById').resolves(current);

  const req = { 
    params: { id }, 
    body: { deliveryFee: 5 },
    user: {
      id: new mongoose.Types.ObjectId(),
      isCustomer: () => true,       // customer user
      canManagePlants: () => false  // cannot update deliveryFee
    }
  };
  const res = { json: sinon.spy(), status: sinon.stub().returnsThis() };

  await updateOrder(req, res);

  expect(res.status.calledWith(403)).to.be.true;
  findByIdStub.restore();
});

  it('should return 404 if order is not found (when changing deliveryFee)', async () => {
  const id = new mongoose.Types.ObjectId().toString();

  const findByIdStub = sinon.stub(Order, 'findById').resolves(null);

  const req = { 
    params: { id }, 
    body: { deliveryFee: 1 },
    user: {
      id: new mongoose.Types.ObjectId(),
      isCustomer: () => false,
      canManagePlants: () => true
    }
  };
  const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

  await updateOrder(req, res);

  expect(findByIdStub.calledOnce).to.be.true;
  expect(res.status.calledWith(404)).to.be.true;
  expect(res.json.calledWith({ message: 'Order not found.' })).to.be.true;

  findByIdStub.restore();
});

  it('should return 400 on invalid id', async () => {
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };
    await updateOrder({ params: { id: 'bad' }, body: {} }, res);
    expect(res.status.calledWith(400)).to.be.true;
  });

  it('should return 500 on error', async () => {
    const id = new mongoose.Types.ObjectId().toString();

    // throwing error triggers 500 path
    const findByIdStub = sinon.stub(Order, 'findById').returns({ lean: () => { throw new Error('DB Error'); } });

    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await updateOrder({ params: { id }, body: { deliveryFee: 1 } }, res);

    expect(findByIdStub.calledOnce).to.be.true;
    expect(res.status.calledWith(500)).to.be.true;
  });
});


describe('DeleteOrder Function Test', () => {

  it('should delete an order successfully', async () => {
    const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
    const findByIdAndDeleteStub = sinon.stub(Order, 'findByIdAndDelete').resolves({ _id: req.params.id });

    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await deleteOrder(req, res);

    expect(findByIdAndDeleteStub.calledOnceWith(req.params.id)).to.be.true;
    expect(res.json.calledWith({ message: 'Order deleted successfully' })).to.be.true;

    findByIdAndDeleteStub.restore();
  });

  it('should return 404 if order is not found', async () => {
    const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
    const findByIdAndDeleteStub = sinon.stub(Order, 'findByIdAndDelete').resolves(null);

    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await deleteOrder(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Order not found' })).to.be.true;

    findByIdAndDeleteStub.restore();
  });

  it('should return 400 on invalid id', async () => {
    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };
    await deleteOrder({ params: { id: 'bad' } }, res);
    expect(res.status.calledWith(400)).to.be.true;
  });

  it('should return 500 if an error occurs', async () => {
    const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
    const findByIdAndDeleteStub = sinon.stub(Order, 'findByIdAndDelete').throws(new Error('DB Error'));

    const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

    await deleteOrder(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;

    findByIdAndDeleteStub.restore();
  });

});
