// Card that works for BOTH admin and customer
// Admin: shows Edit/Delete
// Customer: show Plant

export default function PlantCard({
  p,
  mode = "admin",           // "admin" | "customer"
  onEdit,                   // admin only
  onDelete,                 // admin only
  onBuyOne,                 // customer only
}) {
  const low = Number(p.stock) <= 5;

  return (
    <div style={{
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      padding: 20,
      background: "#fff",
      display: "flex",
      flexDirection: "column",
      gap: 10
    }}>
      <h3 style={{ margin: 0 }}>{p.name}</h3>
      <div>${Number(p.price).toFixed(2)} · {p.category || "—"}</div>
      <div style={{ color: "green" }}>{p.description || "—"}</div>
      <small>
        Stock: {p.stock}
        {low && (
          <span style={{
            marginLeft: 8,
            fontSize: 20,
            background: "pink",
            color: "maroon",
            padding: "2px 6px",
            borderRadius: 10
          }}>
            Low
          </span>
        )}
      </small>

      {mode === "admin" ? (
        <div style={{ marginTop: 8, display: "flex", gap: 8, }}>
          <button onClick={() => onEdit?.(p)}>Edit</button>
          <button onClick={() => onDelete?.(p._id)}>Delete</button>
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          <button onClick={() => onBuyOne?.(p)}>Buy 1</button>
        </div>
      )}
    </div>
  );
}
