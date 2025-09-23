import { useEffect, useMemo, useState } from "react";
import api from "../axiosConfig";
import PaymentSelector from "../components/PaymentSelector";
import LoyaltyBadge from "../components/LoyaltyBadge";
import { useAuth } from "../context/AuthContext";

export default function OrderManager() {
  const { user } = useAuth();
  const [plants, setPlants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [rows, setRows] = useState([{ plant: "", qty: 1 }]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState("stripe");
  const [processing, setProcessing] = useState(false); // added for payment process (mock)
  const [channels, setChannels] = useState({ email: true, sms: false, toast: true });
  const [processingId, setProcessingId] = useState(null);
  // const [notifyResult, setNotifyResult] = useState(null);

  // Customer - Cancel order
  const canCancel = (order) => {
    const created = new Date(order.createdAt);
    const now = new Date();
    const diffMinutes = (now - created) / (1000 * 60);
    return order.status !== "cancelled" && diffMinutes <= 5; // allow paid too
  };

  // API helper
  async function cancelOrder(orderId) {
    await api.put(`/orders/${orderId}/cancel`);
  }

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, oRes] = await Promise.all([
        api.get("/plants"),
        api.get("/orders"),
      ]);
      setPlants(pRes.data);
      setOrders(oRes.data);
      setMsg(""); // clear any old “no token” text
    } catch (e) {
      // show something soft, but don’t block the page forever
      const m = e?.response?.data?.message || e.message || "Failed to load data";
      setMsg(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const plantById = useMemo(
    () => Object.fromEntries(plants.map((p) => [p._id, p])),
    [plants] // dependency array
  );

  // Which plants are low
  const lowStockPlants = useMemo(
    () => plants.filter((p) => p?.isLowStock === true || Number(p?.stock) <= 5),
    [plants]  // dependency array
  );

  const subtotal = rows.reduce(
    (s, r) => s + (plantById[r.plant]?.price ?? 0) * Number(r.qty || 0),
    0
  );
  const total = subtotal + Number(deliveryFee || 0);

  const addRow = () => setRows((r) => [...r, { plant: "", qty: 1 }]);
  const removeRow = (i) =>
    setRows((r) => r.filter((_, idx) => idx !== i));
  const changeRow = (i, key, val) =>
    setRows((r) =>
      r.map((row, idx) =>
        idx === i ? { ...row, [key]: val } : row
      )
    );

  const processPayment = async (amount, provider) => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // simulate latency

    // generate mock receipt
    const timestamp = Date.now();
    // const random = Math.floor(Math.random() * 1234);
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

    // Build items array with plant details
    // UX guard: block orders that would drop stock to <= 5
   const items = rows
      .filter(r => r.plant && Number(r.qty) > 0)
      .map(r => {
        const p = plantById[r.plant];
        return {
          plant: r.plant,
          name: p?.name,
          price: Number(p?.price ?? 0),
          qty: Number(r.qty)
        };
      }); 

      if (!items.length) {
      return setMsg("Add at least one item");
    }

    const offenders = items.filter(it => {
      const p = plantById[it.plant];
      return p && (Number(p.stock) - Number(it.qty)) <=5;
    });
    if (offenders.length) {
      return setMsg('Insufficient stock: ${offenders.map(o => o.name).join(', ')}');
    }

    setProcessing(true);
    setMsg("Processing payment...");

    try {
      const paymentResult = await processPayment(total, provider);
      setMsg("Payment successful. Creating order...");

      const chosenChannels = Object.entries(channels)
        .filter(([, on]) => on)
        .map(([k]) => k);

      const { data } = await api.post("/inventory/apply-order", {
        items,
        deliveryFee: Number(deliveryFee || 0),
        provider: paymentResult.provider,
        receiptId: paymentResult.receiptId,
        channels: chosenChannels, // Send channels
      });

      console.log(`💳 [Frontend] ${provider} charged $${data?.total ?? "?"} → receipt ${paymentResult.receiptId ?? "N/A"}`);

      // Update UI with the server's order
      setOrders((o) => [data, ...o]); // After the POST succeeds
      setRows([{ plant: "", qty: 1 }]);
      setDeliveryFee(0);
      setMsg(
        `Order created successfully. Payment: ${data.provider || "N/A"} (${data.receiptId || "N/A"})`
      );

      if (user?.loyaltyTier && user.loyaltyTier !== 'none') {
        const pointsEarned = Math.floor(data.total);
        setTimeout(() => {
          setMsg(prev => `${prev} | 🎉 You earned ${pointsEarned} loyalty points!`);
        }, 2000);
      }
    } catch (e) {
      console.error("Order/Payment failed", e);
      setMsg(e?.response?.data?.message || e.message || "Order creation failed");
    } finally {
      setProcessing(false);
    }
  };

  // Admin- Delete order
  // const isAdmin = true; real auth later
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

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <div className="flex justify-between items-center mb-4">
        <h1>Order Manager</h1>
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
          color: msg.includes("failed") || msg.includes("error") ? "#d32f2f" : "inherit"
        }}>
          {msg}
        </div>
      )}

      <form onSubmit={createOrder} style={{ display: "grid", gap: 10 }}>
        <h3>Create Order</h3>

        {/*Show low-stock warning*/}
        {lowStockPlants.length > 0 && (
          <div role="alert" style={{
            marginBottom: 8,
            padding: 8,
            background: '#FFF7E6',
            border: '1px solod #FFFE0B3',
            borderRadius: 6
          }}>
            {lowStockPlants.length} item{lowStockPlants.length > 1 ? 's' : ''} low on stock:&nbsp;
            {lowStockPlants.slice(0, 4).map(p => `${p.name} (${p.stock} left)`).join(', ')}
            {lowStockPlants.length > 4 ? '...' : ''}
          </div>
        )}
        {rows.map((r, i) => (
          <div
            key={i}
            style={{ display: "grid", gridTemplateColumns: "3fr 1fr auto", gap: 8 }}
          >
            <select
              value={r.plant}
              onChange={(e) => changeRow(i, "plant", e.target.value)}
              required
            >
              <option value="">Select plant…</option>
              {plants.map((p) => {
                const low = (p.isLowStock === true) || (Number(p.stock) <= 5);
                return (
                  <option
                    key={p._id}
                    value={p._id}
                    disabled={low}
                    title={low ? `Low stock: ${p.stock} left` : ''}
                    aria-disabled={low}>
                    {p.name} - ${Number(p.price).toFixed(2)} {low ? `(Low stock - ${p.stock} left)` : ''}
                  </option>
                );
              })}
            </select>
            <input
              type="number"
              min="1"
              value={r.qty}
              onChange={(e) => changeRow(i, "qty", e.target.value)}
            />
            <button type="button" onClick={() => removeRow(i)}>
              Remove
            </button>
          </div>
        ))}
        <div>
          <button type="button" onClick={addRow}>
            + Add Item
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div>Subtotal: ${subtotal.toFixed(2)}</div>
          <div>
            Delivery Fee:{" "}
            <input
              type="number"
              step="0.01"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
            />
          </div>
          <div>
            <strong>Total: ${total.toFixed(2)}</strong>
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

        <button type="submit" disabled={processing}>
          {processing ? "Processing Payment..." : "Create Order"}
        </button>
      </form>

      <hr style={{ margin: "16px 0" }} />

      {loading ? (
        <p>Loading…</p>
      ) : orders.length === 0 ? (
        <p>No orders yet</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
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
                            await cancelOrder(id); // call API
                            setMsg("Success: Order cancelled!");
                            setOrders((prev) =>
                              prev.map((ord) =>
                                ord._id === id ? { ...ord, status: "cancelled" } : ord)
                            );
                          } catch (err) {
                            const m = err?.response?.data?.message || err.message || "Cancel failed";
                            setMsg(`Error: ${m}`);
                            // setMsg("Error: Cancel failed");
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
                            await del(id);  // no confirm inside del()
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