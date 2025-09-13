import { useEffect, useState } from "react";
import api from "../axiosConfig";
import PlantCard from "../components/PlantCard";

export default function PlantsPage() {
  const [plants, setPlants]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Load plants
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/plants");
      setPlants(data || []);
      setError("");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load plants");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  // Buy 1 (works now as a demo; swap to real POST when cart API is merged)
  const buyOne = async (p) => {
    try {
      // When the cart endpoint is available, replace the alert with:
      // await api.post("/api/cart", { plantId: p._id, qty: 1 });
      alert(`(Demo) Added 1 x ${p.name} to cart`);
    } catch (e) {
      alert(e?.response?.data?.message || "Add to cart failed");
    }
  };

  return (
    <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", background: "#ecfdf5", minHeight: "100vh",padding: 16 }}>
      <h2>Plant Catalog</h2>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "#b00020" }}>{error}</p>}
      {!loading && !error && plants.length === 0 && <p>No plants yet.</p>}

      {!loading && !error && plants.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
          gap: 24,
          maxWidth: 1200,
          margin: "0 auto",
          justifyContent: "center",
          padding: 16,
          background: "#ecfdf5", // light green page section

        }}>
          {plants.map(p => (
            <PlantCard
              key={p._id}
              p={p}
              mode="customer"            //  customer view
              onBuyOne={buyOne}          // enables the “Buy 1” button
            />
          ))}
        </div>
      )}
    </div>
  );
}
