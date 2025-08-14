import { useEffect, useState } from "react";
import api from "../axiosConfig";

export default function PlantManager() {
  const empty = { name: "", price: "", stock: 0, category: "", description: "" };
  const [plants, setPlants] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("api/plants");
      setPlants(data);
      setMsg("");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load plants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
      if (editingId) {
        const { data } = await api.put(`api/plants/${editingId}`, payload);
        setPlants((xs) => xs.map((x) => (x._id === editingId ? data : x)));
        setMsg("Plant updated");
      } else {
        const { data } = await api.post("api/plants", payload);
        setPlants((xs) => [data, ...xs]);
        setMsg("Plant added");
      }
      setForm(empty); setEditingId(null);
    } catch (e) { setMsg(e?.response?.data?.message || "Save failed"); }
  };

  const edit = (p) => {
    setEditingId(p._id);
    setForm({
      name: p.name || "", price: p.price ?? "", stock: p.stock ?? 0,
      category: p.category || "", description: p.description || ""
    });
  };

  const del = async (id) => {
    if (!window.confirm("Delete this plant?")) return;
    try { await api.delete(`api/plants/${id}`); setPlants((xs) => xs.filter((x) => x._id !== id)); setMsg("Plant deleted"); }
    catch (e) { setMsg(e?.response?.data?.message || "Delete failed"); }
  };

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <h1>Plant Manager</h1>
      {msg && <div style={{ background: "#f8f9ff", border: "1px solid #e6e8ff", padding: 8 }}>{msg}</div>}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(6,1fr)", marginTop: 8 }}>
        <input name="name" placeholder="Name" value={form.name} onChange={onChange} required />
        <input name="price" type="number" step="0.01" placeholder="Price" value={form.price} onChange={onChange} required />
        <input name="stock" type="number" placeholder="Stock" value={form.stock} onChange={onChange} />
        <input name="category" placeholder="Category" value={form.category} onChange={onChange} />
        <input name="description" placeholder="Description" value={form.description} onChange={onChange} />
        <button type="submit">{editingId ? "Update" : "Add"} Plant</button>
      </form>

      <hr style={{ margin: "16px 0" }} />

      {loading ? <p>Loading…</p> : plants.length === 0 ? <p>No plants yet</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Name</th><th>Price</th><th>Stock</th>
              <th align="left">Category</th><th align="left">Description</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plants.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td align="center">${Number(p.price).toFixed(2)}</td>
                <td align="center">{p.stock}</td>
                <td>{p.category}</td>
                <td>{p.description}</td>
                <td align="center">
                  <button onClick={() => edit(p)}>Edit</button>{" "}
                  <button onClick={() => del(p._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
