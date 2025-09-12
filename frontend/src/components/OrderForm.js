import { useState } from "react";
import api from "../axiosConfig";

export default function OrderForm({ cartItems }) {
  const [giftWrap, setGiftWrap] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    try {
      const { data } = await api.post("/api/orders", {
        items: cartItems,
        giftWrap,
        warranty
      });
      setResult(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h3>Extras</h3>
      <label>
        <input type="checkbox" checked={giftWrap} onChange={() => setGiftWrap(!giftWrap)} />
        Gift Wrap (+$5)
      </label>
      <label>
        <input type="checkbox" checked={warranty} onChange={() => setWarranty(!warranty)} />
        Warranty (+$10)
      </label>

      <button onClick={handleSubmit}>Place Order</button>

      {result && (
        <div>
          <p>{result.description}</p>
          <p>Total: ${result.total}</p>
        </div>
      )}
    </div>
  );
}
