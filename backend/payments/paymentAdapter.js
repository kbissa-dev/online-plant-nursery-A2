// Simple payment adapters: same interface, different providers
class PaymentMethod {
  async charge(amount, meta) { throw new Error('Not implemented'); }
}

class StripeAdapter extends PaymentMethod {
  async charge(amount, meta = {}) {
    console.log(`💳 Stripe charging $${amount} for user ${meta.userId ?? 'anon'}`);
    return { provider: 'stripe', id: 'stripe_txn_123' }; // fake receipt
  }
}

class PaypalAdapter extends PaymentMethod {
  async charge(amount, meta = {}) {
    console.log(`💳 PayPal charging $${amount} for user ${meta.userId ?? 'anon'}`);
    return { provider: 'paypal', id: 'paypal_txn_456' }; // fake receipt
  }
}

module.exports = { PaymentMethod, StripeAdapter, PaypalAdapter };
