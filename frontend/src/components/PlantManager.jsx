import { useEffect, useState } from "react";
import api from "../axiosConfig";
import PlantCard from "./PlantCard";

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
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16,color: "olive" }}>
      <h1>Plant Manager</h1>
      {msg && <div style={{ background: "#f8f9ff", border: "1px solid #e6e8ff", padding: 10 }}>{msg}</div>}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12,
        gridTemplateColumns: "1.2fr 0.8fr 0.5fr 1fr 2fr auto",
        alignItems: "center", margin: "8px 0 20px"}}>
        <input name="name" placeholder="Name" value={form.name} onChange={onChange} required />
        <input name="price" type="number" step="0.01" placeholder="Price" value={form.price} onChange={onChange} required />
        <input name="stock" type="number" placeholder="Stock" value={form.stock} onChange={onChange} />
        <input name="category" placeholder="Category" value={form.category} onChange={onChange} />
        <input name="description" placeholder="Description" value={form.description} onChange={onChange} />
        <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded" 
        style={{padding: "10px 14px", borderRadius: 10, whiteSpace: "nowrap",      // prevents  wrapping
          lineHeight: 1,             // nice vertical rhythm
        // height: 40,
        }}
        >{editingId ? "Update" : "Add"} Plant</button>
      </form>

      <hr style={{ margin: "16px 0" }} />

      {loading ? <p>Loading…</p> : plants.length === 0 ? <p>No plants yet</p> : (
        <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
          gap: 20
        }}
      >
        {plants.map((p) => (
          <PlantCard
            key={p._id}
            p={p}
            mode="admin"
            onEdit={edit}
            onDelete={del}
          />
        ))}
      </div>
    )}
    </div>
  );
}
