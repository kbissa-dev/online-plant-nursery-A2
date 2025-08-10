// OPNS-26: tiny change to trigger Jira linking

import { useEffect, useMemo, useState } from "react";
import api from "../axiosConfig";

export default function OrderManager() {
  const [plants, setPlants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [rows, setRows] = useState([{ plant: "", qty: 1 }]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, oRes] = await Promise.all([api.get("/plants"), api.get("/orders")]);
      setPlants(pRes.data); setOrders(oRes.data); setMsg("");
    } catch (e) { setMsg(e?.response?.data?.message || "Failed to load data"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const plantById = useMemo(() => Object.fromEntries(plants.map(p => [p._id, p])), [plants]);

  const subtotal = rows.reduce((s, r) => (s + (plantById[r.plant]?.price ?? 0) * Number(r.qty || 0)), 0);
  const total = subtotal + Number(deliveryFee || 0);

  const addRow = () => setRows(r => [...r, { plant: "", qty: 1 }]);
  const removeRow = (i) => setRows(r => r.filter((_, idx) => idx !== i));
  const changeRow = (i, key, val) => setRows(r => r.map((row, idx) => idx === i ? { ...row, [key]: val } : row));

  const createOrder = async (e) => {
    e.preventDefault();
    const items = rows.filter(r => r.plant && Number(r.qty) > 0).map(r => ({ plant: r.plant, qty: Number(r.qty) }));
    if (!items.length) return setMsg("Add at least one item");
    try {
      const { data } = await api.post("/orders", { items, deliveryFee: Number(deliveryFee || 0) });
      setOrders(o => [data, ...o]); setRows([{ plant: "", qty: 1 }]); setDeliveryFee(0); setMsg("Order created");
    } catch (e) { setMsg(e?.response?.data?.message || "Order create failed"); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    try { await api.delete(`/orders/${id}`); setOrders(o => o.filter(x => x._id !== id)); setMsg("Order deleted"); }
    catch (e) { setMsg(e?.response?.data?.message || "Delete failed"); }
  };

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <h1>Order Manager</h1>
      {msg && <div style={{ background: "#f8f9ff", border: "1px solid #e6e8ff", padding: 8 }}>{msg}</div>}

      <form onSubmit={createOrder} style={{ display: "grid", gap: 10 }}>
        <h3>Create Order</h3>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr auto", gap: 8 }}>
            <select value={r.plant} onChange={(e) => changeRow(i, "plant", e.target.value)} required>
              <option value="">Select plant…</option>
              {plants.map(p => <option key={p._id} value={p._id}>{p.name} — ${Number(p.price).toFixed(2)}</option>)}
            </select>
            <input type="number" min="1" value={r.qty} onChange={(e) => changeRow(i, "qty", e.target.value)} />
            <button type="button" onClick={() => removeRow(i)}>Remove</button>
          </div>
        ))}
        <div><button type="button" onClick={addRow}>+ Add Item</button></div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, alignItems: "center" }}>
          <div>Subtotal: ${subtotal.toFixed(2)}</div>
          <div>Delivery Fee: <input type="number" step="0.01" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} /></div>
          <div><strong>Total: ${total.toFixed(2)}</strong></div>
        </div>
        <button type="submit">Create Order</button>
      </form>

      <hr style={{ margin: "16px 0" }} />

      {loading ? <p>Loading…</p> : orders.length === 0 ? <p>No orders yet</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Created</th><th align="left">Items</th>
              <th>Subtotal</th><th>Delivery</th><th>Total</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o._id}>
                <td>{new Date(o.createdAt).toLocaleString()}</td>
                <td>{o.items?.map((it, idx) => <div key={idx}>{it.name} × {it.qty} @ ${Number(it.price).toFixed(2)}</div>)}</td>
                <td align="center">${Number(o.subtotal).toFixed(2)}</td>
                <td align="center">${Number(o.deliveryFee).toFixed(2)}</td>
                <td align="center">{o.status}</td>
                <td align="center"><button onClick={() => del(o._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
