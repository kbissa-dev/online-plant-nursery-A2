import { useEffect, useState } from "react";
import api from "../axiosConfig";
import { useNavigate } from "react-router-dom";


const LOW_STOCK = 5;

function PlantCard({ p, reload }) {
  // NEW: demo decrement — calls protected route:
  // POST /api/inventory/plants/:id/adjust  { delta: -1 }
  const nav = useNavigate();                      // add this

  const dec = async () => {
    try {
      await api.post(`/api/inventory/plants/${p._id}/adjust`, { delta: -1 });
      await reload();
    } catch (e) {
      if (e?.response?.status === 401) {
        nav("/login");                            // go log in
      } else {
        alert(e?.response?.data?.message || e.message);
      }
    }
  };

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h3 style={{ margin: "0 0 6px", flex: 1 }}>{p.name}</h3>
        {/* NEW: low-stock badge */}
        {p.stock <= LOW_STOCK && (
          <span style={{ fontSize: 12, padding: "2px 6px", borderRadius: 8, background: "#fde7e7", color: "#b3261e" }}>
            Low stock
          </span>
        )}
      </div>

      <div>${Number(p.price || 0).toFixed(2)} · {p.category}</div>

      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", opacity: 0.8 }}>
        {(p.description || "").trim()}
      </div>

      <div style={{ marginTop: 8, fontSize: 12 }}>Stock: {p.stock ?? 0}</div>

      {/* NEW: demo button to decrement stock */}
      <div style={{ marginTop: 10 }}>
        <button
          onClick={dec}
          disabled={(p.stock ?? 0) <= 0}
          style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, cursor: "pointer" }}
          title="Decrement stock by 1 (demo)"
        >
          Test −1
        </button>
      </div>
    </div>
  );
}

export default function PlantsPage() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // CHANGED: make load() reusable (so the card can call it after updates)
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/plants");
      setPlants(data || []);
      setError("");
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load plants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <p>Loading plants…</p>;
  if (error)   return <p>{error}</p>;
  if (!plants.length) return <p>No plants yet.</p>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
      {/* CHANGED: pass reload={load} */}
      {plants.map(p => <PlantCard key={p._id} p={p} reload={load} />)}
    </div>
  );
}
