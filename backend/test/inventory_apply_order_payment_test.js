// backend/test/inventory_combined_test.js
// Mocha + Chai + Sinon — one file for payments + events

const { expect } = require("chai");
const sinon = require("sinon");

// Service & event bus
const { InventoryManager, inventoryEvents } = require("../services/inventoryManager");
// We only stub Order.create; no real DB
const Order = require("../models/Order");

describe("InventoryManager - payments + events (stubbed, no DB)", () => {
  let svc;

  beforeEach(() => {
    // Build a service instance with dummy models (we stub what we touch)
    svc = new InventoryManager({
      PlantModel: {},           // not used in these tests
      OrderModel: Order,        // we'll stub Order.create
      lowStockThreshold: 5,
    });
  });

  afterEach(() => {
    sinon.restore();
    inventoryEvents.removeAllListeners(); // keep event tests clean
  });

  // -Payments-

  it("creates order with Stripe and decrements stock", async () => {
    const items = [{ plant: "p1", name: "Rose", price: 10, qty: 2 }];

    // Pretend stock decrement succeeded
    const adj = sinon.stub(svc, "adjustStock").resolves({ _id: "p1", stock: 3 });

    // Fake Order.create return (what the service would persist)
    sinon.stub(Order, "create").resolves({
      toObject: () => ({
        _id: "o1",
        items,
        subtotal: 20,
        deliveryFee: 0,
        total: 20,
        status: "paid",
        provider: "stripe",
        receiptId: "stripe_123",
      }),
    });

    const order = await svc.applyOrder({
      userId: "u1",
      items,
      deliveryFee: 0,
      provider: "stripe",
    });

    expect(order.subtotal).to.equal(20);
    expect(order.total).to.equal(20);
    expect(order.provider).to.equal("stripe");
    expect(order.receiptId).to.equal("stripe_123");
    expect(adj.calledOnceWith("p1", -2)).to.be.true;
  });

  it("creates order with PayPal and decrements stock", async () => {
    const items = [{ plant: "p2", name: "Lavender", price: 15, qty: 1 }];

    const adj = sinon.stub(svc, "adjustStock").resolves({ _id: "p2", stock: 3 });

    sinon.stub(Order, "create").resolves({
      toObject: () => ({
        _id: "o2",
        items,
        subtotal: 15,
        deliveryFee: 0,
        total: 15,
        status: "paid",
        provider: "paypal",
        receiptId: "paypal_456",
      }),
    });

    const order = await svc.applyOrder({
      userId: "u1",
      items,
      deliveryFee: 0,
      provider: "paypal",
    });

    expect(order.subtotal).to.equal(15);
    expect(order.total).to.equal(15);
    expect(order.provider).to.equal("paypal");
    expect(order.receiptId).to.equal("paypal_456");
    expect(adj.calledOnceWith("p2", -1)).to.be.true;
  });

  it("throws error when stock is insufficient", async () => {
    const items = [{ plant: "p3", name: "Monstera", price: 25, qty: 3 }];

    // Make the decrement fail — service treats this as insufficient/not found
    sinon.stub(svc, "adjustStock").resolves(null);

    try {
      await svc.applyOrder({ userId: "u1", items, deliveryFee: 0, provider: "stripe" });
      throw new Error("Expected error not thrown");
    } catch (err) {
      expect(err.message).to.match(/Insufficient stock|plant not found/i);
    }
  });

  it("rejects when items is missing or empty", async () => {
    try {
      await svc.applyOrder({ userId: "u1", items: [], deliveryFee: 0, provider: "stripe" });
      throw new Error("Expected error not thrown");
    } catch (err) {
      expect(err.message).to.match(/at least one item/i);
    }
  });

  // -Events-

  it("emits 'low-stock' when stock drops below threshold", (done) => {
    // Listen once; if we hear it, assertions + done()
    inventoryEvents.once("low-stock", (payload) => {
      try {
        expect(payload).to.include.keys(["plantId", "name", "stock", "threshold"]);
        expect(payload.plantId).to.equal("p1");
        expect(payload.name).to.equal("Rose");
        expect(payload.stock).to.equal(2);
        expect(payload.threshold).to.equal(5);
        done();
      } catch (e) {
        done(e);
      }
    });

    // Trigger the (private) helper directly with a doc below threshold
    svc._emitLowStockIfNeeded({ _id: "p1", name: "Rose", stock: 2 });
  });
});
