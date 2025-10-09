import { useEffect, useState } from "react";
import api from "../axiosConfig";
import PlantCard from "./PlantCard";

export default function PlantManager() {
  const empty = { name: "", price: "", stock: 0, category: "", description: "", image: null };
  const [plants, setPlants] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/plants");
      setPlants(data);
      setMsg("");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load plants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onChange = (e) => {
    if (e.target.type === 'file') {
      setForm({ ...form, image: e.target.files[0] });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

const onSubmit = async (e) => {
  e.preventDefault();
  try {
    // if editing plant
    if (editingId) {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('price', Number(form.price));
      formData.append('stock', Number(form.stock));
      formData.append('category', form.category || '');
      formData.append('description', form.description || '');
      
      if (form.image) {
        formData.append('image', form.image);
      }

      const { data } = await api.put(`/plants/${editingId}`, formData, {
        headers: {
          'Content-Type': undefined
        }
      });
      setPlants((xs) => xs.map((x) => (x._id === editingId ? data : x)));
      setMsg("Plant updated");
    } else {
      // creating new plant
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('price', Number(form.price));
      formData.append('stock', Number(form.stock));
      formData.append('category', form.category || '');
      formData.append('description', form.description || '');
      
      if (form.image) {
        formData.append('image', form.image);
      }

      const { data } = await api.post("/plants", formData, {
        headers: {
          'Content-Type': undefined
        }
      });
      setPlants((xs) => [data, ...xs]);
      setMsg("Plant added");
    }
    setForm(empty); 
    setEditingId(null);
  } catch (e) { 
    setMsg(e?.response?.data?.message || "Save failed"); 
  }
};

  const edit = (p) => {
    setEditingId(p._id);
    setForm({
      name: p.name || "", 
      price: p.price ?? "", 
      stock: p.stock ?? 0,
      category: p.category || "", 
      description: p.description || "",
      image: null // reset image field
    });
  };

  const del = async (id) => {
    if (!window.confirm("Delete this plant?")) return;
    try { await api.delete(`/plants/${id}`); setPlants((xs) => xs.filter((x) => x._id !== id)); setMsg("Plant deleted"); }
    catch (e) { setMsg(e?.response?.data?.message || "Delete failed"); }
  };

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16, color: "olive" }}>
      <h1>Plant Manager</h1>
      {msg && <div style={{ background: "#f8f9ff", border: "1px solid #e6e8ff", padding: 10 }}>{msg}</div>}

      <form onSubmit={onSubmit} style={{ marginBottom: 20 }}>
        {/* main fields row */}
        <div style={{ 
          display: "grid", 
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          alignItems: "center", 
          marginBottom: 16 
        }}>
          <input 
            name="name" 
            placeholder="Name" 
            value={form.name} 
            onChange={onChange} 
            required 
            style={{ minWidth: 0 }}
          />

          <input 
            name="price" 
            type="number" 
            step="0.01" 
            placeholder="Price" 
            value={form.price} 
            onChange={onChange} 
            required 
            style={{ minWidth: 0 }}
          />

          <input 
            name="stock" 
            type="number" 
            placeholder="Stock" 
            value={form.stock} 
            onChange={onChange} 
            style={{ minWidth: 0 }}
          />

          <input 
            name="category" 
            placeholder="Category" 
            value={form.category} 
            onChange={onChange} 
            style={{ minWidth: 0 }}
          />
          
          <input 
            name="description" 
            placeholder="Description" 
            value={form.description} 
            onChange={onChange} 
            style={{ minWidth: 0, gridColumn: "span 2" }}
          />
        </div>

        {/* image upload */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: 8, 
          marginBottom: 16,
          padding: 12,
          background: "#f9f9f9",
          borderRadius: 4,
          border: "1px solid #e0e0e0"
        }}>
          <label style={{ fontWeight: "bold", fontSize: "14px" }}>Plant Image:</label>
          
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
              style={{ flex: "1", minWidth: "200px" }}
            />
            
            {editingId && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "12px", color: "#666" }}>Current:</span>
                <img 
                  src={`/images/plants/${plants.find(p => p._id === editingId)?.image || 'placeholder.jpg'}`}
                  alt="Current plant"
                  style={{ 
                    height: 40, 
                    width: 40, 
                    objectFit: "cover", 
                    borderRadius: 4,
                    border: "1px solid #ddd"
                  }}
                  onError={(e) => {
                    e.target.src = '/images/plants/placeholder.jpg';
                  }}
                />
              </div>
            )}
          </div>
          
          {form.image && (
            <div style={{ fontSize: "12px", color: "#666" }}>
              Selected: {form.image.name}
            </div>
          )}
        </div>

        <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded">
          {editingId ? "Update" : "Add"} Plant
        </button>
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
