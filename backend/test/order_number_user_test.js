const { expect } = require('chai');
const sinon = require('sinon');

const { InventoryManager } = require('../services/inventoryManager');
const paymentAdapter = require('../payments/paymentAdapter');
const notificationSvc = require('../services/notificationService');

const mkLean = (val) => ({ lean: sinon.stub().resolves(val) });

describe('Order number shows up in notifications', () => {
    let sendSpy, stripeStub;

        // Plant 
        const PlantModel = {
            findOneAndUpdate: sinon.stub().returns(
                mkLean({
                    _id: 'p1',
                    name: 'Strawberry',
                    stock: 10
                })
            ),
        };

        // Order: first create, then mark as paid
        const createdOrder = {
            _id: 'o1',
            orderNumber: 6,
            items: [{
                    plant: 'p1',
                    name: 'Strawberry',
                    price: 12,
                    qty: 1}],
            subtotal: 12,
            deliveryFee: 0,
            total: 12,
            status: 'pending',
            provider: 'stripe',
            receiptId: 'null',
            createdBy: 'u1',
            toObject() { return {...this }; },
        };

        const OrderModel = {
            create: sinon.stub().resolves(createdOrder),  // initial insert
            findByIdAndUpdate: sinon.stub().resolves({
                ...createdOrder, status: 'paid',
                receiptId: 'stripe_123'
            }),    // set status to 'paid'
        };

        const userLean = { _id: 'u1', name: 'Test_User 1' };
        const userDoc = {
            _id: 'u1',
            name: 'Test_User 1',
            addPurchase: sinon.stub().returns({ tierChanged: false, newTier: 'silver', pointsEarned: 12}),
            save: sinon.stub().resolves(),
        };

        const UserModel = { 
            findById: sinon.stub()
            .onFirstCall().returns(mkLean(userLean))
            .onSecondCall().resolves(userDoc),
            };

        beforeEach(() => {
            sendSpy = sinon.spy();
            sinon.stub(notificationSvc, 'buildNotifier').returns({ send: sendSpy });
            stripeStub = sinon.stub(paymentAdapter.StripeAdapter.prototype, 'charge')
            .resolves({ id: 'stripe_123' });
        });

        afterEach(() => sinon.restore());

        it('includes #<orderNumber> and customer name in the message', async () => {
            const mgr =new InventoryManager({ PlantModel, OrderModel, UserModel });

            await mgr.applyOrder({
                userId: 'u1',
                items: [{
                    plant: 'p1',
                    name: 'Strawberry',
                    price: 12,qty: 1}],
                    deliveryFee: 0,
                    provider: 'stripe',
                    channels: ['email', 'toast'],
                });

                expect(sendSpy.calledOnce).to.equal(true);
                const msg = sendSpy.firstCall.args[0];
                expect(msg).to.match(/Order\s+#6\b/); // orderNumber badge
                expect(msg).to.include('Test_User 1'); // customer name
                expect(stripeStub.calledOnce).to.equal(true);
            });
        });