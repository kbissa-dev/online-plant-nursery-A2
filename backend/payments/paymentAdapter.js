// Simple payment adapters: same interface, different providers
class PaymentMethod {
  async charge(amount, meta) { throw new Error('Not implemented'); }
}

class StripeAdapter {
  async charge(amount, { userId }) {
    console.log(`💳 Stripe charging $${amount} for user ${userId}`); // TRACE
    return { id: 'stripe_' + Date.now(), amount };
  }
}
class PaypalAdapter {
  async charge(amount, { userId }) {
    console.log(`💳 PayPal charging $${amount} for user ${userId}`); // TRACE
    return { id: 'paypal_' + Date.now(), amount };
  }
}


module.exports = { PaymentMethod, StripeAdapter, PaypalAdapter };
