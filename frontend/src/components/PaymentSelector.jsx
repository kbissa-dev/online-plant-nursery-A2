import { useState } from "react";

export default function PaymentSelector({ value = "stripe", onChange }) {
  const [provider, setProvider] = useState(value);

  const handle = (e) => {
    const v = e.target.value;
    setProvider(v);
    onChange?.(v);
  };

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", margin: "8px 0" }}>
      <strong>Payment:</strong>
      <label><input type="radio" name="provider" value="stripe"
        checked={provider === "stripe"} onChange={handle}/> Stripe</label>
      <label><input type="radio" name="provider" value="paypal"
        checked={provider === "paypal"} onChange={handle}/> PayPal</label>
    </div>
  );
}
