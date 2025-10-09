import { useEffect, useState } from "react";
import api from "../axiosConfig";
import PaymentSelector from "../components/PaymentSelector";
import LoyaltyBadge from "../components/LoyaltyBadge";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function OrderManager() {
  const { user } = useAuth();
  const { 
    cartItems, 
    clearCart, 
    cartTotals, 
    calculationLoading, 
    calculationError,
    calculateWithDelivery 
  } = useCart();
  const [orders, setOrders] = useState([]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState("stripe");
  const [processing, setProcessing] = useState(false);
  const [channels, setChannels] = useState({ email: true, sms: false, toast: true });
  const [processingId, setProcessingId] = useState(null);

  // update cart totals when delivery fee changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (cartItems.length > 0) {
        calculateWithDelivery(Number(deliveryFee) || 0);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [deliveryFee, cartItems.length, calculateWithDelivery]);

  // customer -> cancel order
  const canCancel = (order) => {
    const created = new Date(order.createdAt);
    const now = new Date();
    const diffMinutes = (now - created) / (1000 * 60);
    return order.status !== "cancelled" && diffMinutes <= 5;
  };

  // API helper
  async function cancelOrder(orderId) {
    await api.put(`/orders/${orderId}/cancel`);
  }

  const load = async () => {
    setLoading(true);
    try {
      const oRes = await api.get("/orders");
      setOrders(oRes.data);
      setMsg("");
    } catch (e) {
      const m = e?.response?.data?.message || e.message || "Failed to load orders";
      setMsg(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const processPayment = async (amount, provider) => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // simulate latency

    const timestamp = Date.now();
    const receiptId = `${provider.toUpperCase()}_${timestamp}`;

    return {
      receiptId,
      provider,
      amount: amount.toFixed(2),
      status: "completed",
      timestamp: new Date().toISOString()
    };
  };

  const createOrder = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      return setMsg("Your cart is empty. Add some plants first!");
    }

    if (calculationError) {
      return setMsg("Cannot checkout: Price calculation failed. Please try again.");
    }

    // build items array from cart
    const items = cartItems.map(cartItem => ({
      plant: cartItem.plant._id,
      name: cartItem.plant.name,
      price: Number(cartItem.plant.price),
      qty: Number(cartItem.qty)
    }));

    // check stock levels
    const stockLevel = cartItems.filter(cartItem => {
      return cartItem.plant && (Number(cartItem.plant.stock) - Number(cartItem.qty)) <= 0;
    });
    
    if (stockLevel.length) {
      return setMsg(`Insufficient stock: ${stockLevel.map(o => o.plant.name).join(', ')}`);
    }

    setProcessing(true);
    setMsg("Processing payment...");

    try {
      const totalAmount = parseFloat(cartTotals.total);
      const paymentResult = await processPayment(totalAmount, provider);
      setMsg("Payment successful. Creating order...");

      const chosenChannels = Object.entries(channels)
        .filter(([, on]) => on)
        .map(([k]) => k);

      const { data } = await api.post("/inventory/apply-order", {
        items,
        deliveryFee: Number(deliveryFee || 0),
        provider: paymentResult.provider,
        receiptId: paymentResult.receiptId,
        channels: chosenChannels,
      });

      console.log(`💳 [Frontend] ${provider} charged $${data?.total ?? "?"} → receipt ${paymentResult.receiptId ?? "N/A"}`);

      // update UI with the server's order
      setOrders((o) => [data, ...o]);
      
      // clear cart after successful order
      clearCart();
      setDeliveryFee(0);
      setMsg(
        data.message ||
        `Order created successfully by ${user?.name || 'Guest'}.
         Payment: ${data.provider || "N/A"} (${data.receiptId || "N/A"})`
      );

      if (user?.loyaltyTier && user.loyaltyTier !== 'none') {
        const pointsEarned = Math.floor(data.total);
        setTimeout(() => {
          setMsg(prev => `${prev} | You earned ${pointsEarned} loyalty points!`);
        }, 2000);
      }
    } catch (e) {
      console.error("Order/Payment failed", e);
      setMsg(e?.response?.data?.message || e.message || "Order creation failed");
    } finally {
      setProcessing(false);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'staff';
  const isCustomer = user?.role === 'customer';

  const del = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    try {
      await api.delete(`/orders/${id}`);
      setOrders((o) => o.filter((x) => x._id !== id));
      setMsg("Order deleted");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
    }
  };

  const hasDiscounts = cartTotals.discounts && cartTotals.discounts.length > 0;
  const isCheckoutDisabled = processing || calculationError || calculationLoading;
  const needsCalculation = cartItems.length > 0 && cartTotals.subtotal === "0.00";

  const triggerCalculation = () => {
    calculateWithDelivery(Number(deliveryFee) || 0);
  };

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <div className="flex justify-between items-center mb-4">
        <h1>Checkout & Orders
          {user?.name && (
            <span className="ml-3 text-green-700 text-base font-semibold">
              Welcome, {user.name}!
            </span>
          )}
        </h1>
        {user?.loyaltyTier && user.loyaltyTier !== 'none' && (
          <div className="text-right">
            <LoyaltyBadge loyaltyTier={user.loyaltyTier} size="sm" showDiscount={true} />
            <div className="text-sm text-gray-600 mt-1">
              Active discount applied to eligible items
            </div>
          </div>
        )}
      </div>

      {msg && (
        <div style={{
          background: msg.includes("success") ? "#e3f0e3" : "#f8f9ff",
          border: `1px solid ${msg.includes("success") ? "#4caf50" : "#e6e8ff"}`,
          padding: 8,
          marginBottom: 16,
          color: msg.includes("failed") || msg.includes("error") ? "#d32f2f" : "inherit"
        }}>
          {msg}
        </div>
      )}

      {/* cart review and checkout */}
      <div style={{ marginBottom: 32, padding: 16, border: "1px solid #e0e0e0", borderRadius: 8 }}>
        <h3>Cart Review & Checkout</h3>
        
        {cartItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, color: "#666" }}>
            <p>Your cart is empty.</p>
            <p>Visit the <a href="/plants" style={{ color: "#4caf50" }}>Plants page</a> to add items to your cart.</p>
          </div>
        ) : (
          <>
            {/* show calculation button if needed */}
            {needsCalculation && (
              <div style={{ 
                textAlign: "center", 
                padding: 16, 
                background: "#f0f8ff", 
                border: "1px solid #2196f3",
                borderRadius: 4,
                marginBottom: 16 
              }}>
                <button 
                  onClick={triggerCalculation}
                  style={{
                    backgroundColor: "#2196f3",
                    color: "white",
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Calculate Prices & Discounts
                </button>
              </div>
            )}

            {/* cart items display */}
            <div style={{ marginBottom: 16 }}>
              <h4>Items in your cart:</h4>
              {cartItems.map((cartItem, i) => (
                <div key={i} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid #f0f0f0"
                }}>
                  <div>
                    <strong>{cartItem.plant.name}</strong> × {cartItem.qty}
                    <div style={{ fontSize: "0.9em", color: "#666" }}>
                      ${Number(cartItem.plant.price).toFixed(2)} each
                    </div>
                  </div>
                  <div style={{ fontWeight: "bold" }}>
                    ${(Number(cartItem.plant.price) * cartItem.qty).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* calculation status */}
            {calculationError && (
              <div style={{ 
                background: "#ffebee", 
                border: "1px solid #f44336", 
                padding: 8, 
                marginBottom: 16,
                borderRadius: 4,
                color: "#d32f2f"
              }}>
                Price calculation failed: {calculationError}
              </div>
            )}

            <form onSubmit={createOrder} style={{ display: "grid", gap: 10 }}>
              {/* pricing display */}
              <div style={{ 
                background: "#f9f9f9", 
                padding: 16, 
                borderRadius: 4, 
                marginBottom: 16 
              }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  marginBottom: 8 
                }}>
                  <strong>Subtotal:</strong>
                  <strong>${cartTotals.subtotal}</strong>
                </div>

                {/* discount breakdown */}
                {hasDiscounts && (
                  <div style={{ 
                    borderTop: "1px solid #e0e0e0", 
                    paddingTop: 8, 
                    marginBottom: 8 
                  }}>
                    <div style={{ 
                      fontWeight: "bold", 
                      color: "#4caf50", 
                      marginBottom: 4 
                    }}>
                      Discounts Applied:
                    </div>
                    {cartTotals.discounts.map((discount, index) => (
                      <div key={index} style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        fontSize: "0.9em",
                        color: "#4caf50",
                        marginBottom: 2
                      }}>
                        <span>{discount.name}: {discount.description}</span>
                        <span>-${discount.amount}</span>
                      </div>
                    ))}
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      fontWeight: "bold",
                      color: "#4caf50",
                      borderTop: "1px solid #e0e0e0",
                      paddingTop: 4,
                      marginTop: 4
                    }}>
                      <span>Total Discount:</span>
                      <span>-${cartTotals.totalDiscount}</span>
                    </div>
                  </div>
                )}

                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginBottom: 8 
                }}>
                  <span>Delivery Fee:</span>
                  <input
                    type="number"
                    step="0.01"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    style={{ width: "80px", marginLeft: "8px" }}
                  />
                </div>

                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  fontSize: "1.2em",
                  fontWeight: "bold",
                  borderTop: "2px solid #4caf50",
                  paddingTop: 8
                }}>
                  <span>Total:</span>
                  <span>${cartTotals.total}</span>
                </div>
              </div>

              <PaymentSelector value={provider} onChange={setProvider} />

              <div style={{ marginTop: 8 }}>
                <strong>Notify me via:</strong>{" "}
                <label>
                  <input
                    type="checkbox"
                    checked={channels.email}
                    onChange={e => setChannels(x => ({ ...x, email: e.target.checked }))}
                  />{" "}
                  Email</label>{" "}
                <label>
                  <input
                    type="checkbox"
                    checked={channels.sms}
                    onChange={e => setChannels(x => ({ ...x, sms: e.target.checked }))}
                  />{" "}
                  SMS</label>{" "}
                <label>
                  <input
                    type="checkbox"
                    checked={channels.toast}
                    onChange={e => setChannels(x => ({ ...x, toast: e.target.checked }))}
                  />{" "}
                  Toast</label>
              </div>

              <button type="submit" disabled={isCheckoutDisabled} style={{
                backgroundColor: isCheckoutDisabled ? "#ccc" : "#4caf50",
                color: "white",
                padding: "12px 16px",
                border: "none",
                borderRadius: "4px",
                cursor: isCheckoutDisabled ? "not-allowed" : "pointer"
              }}>
                {processing ? "Processing Payment..." : 
                 calculationError ? "Cannot checkout - Price error" :
                 calculationLoading ? "Calculating..." :
                 `Place Order - $${cartTotals.total}`}
              </button>
            </form>
          </>
        )}
      </div>

      <hr style={{ margin: "16px 0" }} />
      
      <h3>Order History</h3>

      {loading ? (
        <p>Loading orders…</p>
      ) : orders.length === 0 ? (
        <p>No orders yet</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "4px" }}>Order #</th>
              <th style={{ textAlign: "left", padding: "4px" }}>Created</th>
              <th style={{ textAlign: "left", padding: "4px" }}>Items</th>
              <th style={{ textAlign: "right", padding: "4px" }}>Subtotal</th>
              <th style={{ textAlign: "right", padding: "4px" }}>Delivery</th>
              <th style={{ textAlign: "right", padding: "4px" }}>Total</th>
              <th style={{ textAlign: "left", padding: "4px" }}>Status</th>
              <th style={{ textAlign: "left", padding: "4px" }}>Payment</th>
              <th style={{ textAlign: "center", padding: "4px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const id = o._id;
              return (
                <tr key={id}>
                  <td>#{o.orderNumber ?? o._id.slice(-4)}</td>
                  <td style={{ padding: "4px" }}>
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "4px" }}>
                    {o.items?.map((it, idx) => (
                      <div key={idx}>
                        {it.name} × {it.qty} @ ${Number(it.price).toFixed(2)}
                      </div>
                    ))}
                  </td>
                  <td style={{ textAlign: "right", padding: "4px" }}>
                    ${Number(o.subtotal).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right", padding: "4px" }}>
                    ${Number(o.deliveryFee).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right", padding: "4px" }}>
                    ${Number(o.total).toFixed(2)}
                  </td>
                  <td style={{ padding: "4px" }}>{o.status}</td>
                  <td style={{ padding: "4px" }}>
                    {o.provider ? `${o.provider} (${o.receiptId || "-"})` : "-"}
                  </td>
                  <td align="center">
                    {/* Cancel (customer) */}
                    {isCustomer && (['pending', 'paid'].includes(o.status)) && canCancel(o) && (
                      <button
                        disabled={processingId === id}
                        onClick={async () => {
                          setProcessingId(id);
                          try {
                            await cancelOrder(id);
                            setMsg("Success: Order cancelled!");
                            setOrders((prev) =>
                              prev.map((ord) =>
                                ord._id === id ? { ...ord, status: "cancelled" } : ord)
                            );
                          } catch (err) {
                            const m = err?.response?.data?.message || err.message || "Cancel failed";
                            setMsg(`Error: ${m}`);
                          } finally {
                            setProcessingId(null);
                          }
                        }}
                        style={
                          processingId === id
                            ? { opacity: 0.6, cursor: "not-allowed" }
                            : undefined
                        }
                      >
                        {processingId === id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                    {/* Delete (admin) */}
                    {isAdmin && (
                      <button
                        disabled={processingId === id}
                        onClick={async () => {
                          if (!window.confirm("Delete this order?")) return;
                          setProcessingId(id);
                          try {
                            await del(id);
                            setOrders((list) => list.filter((x) => x._id !== id));
                            setMsg("Order deleted");
                          } catch (e) {
                            setMsg(e?.response?.data?.message || "Delete failed");
                          } finally {
                            setProcessingId(null);
                          }
                        }}
                        style={{
                          marginLeft: 8,
                          ...(processingId === id
                            ? { opacity: 0.6, cursor: "not-allowed" }
                            : {}),
                        }}
                      >
                        {processingId === id ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}