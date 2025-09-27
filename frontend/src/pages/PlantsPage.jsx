import { useEffect, useState } from "react";
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from "../axiosConfig";

export default function PlantsPage() {
  const { user } = useAuth();
  const { addToCart, cartItems } = useCart();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");

  // load plants
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const config = user?.token ? {
          headers: { Authorization: `Bearer ${user.token}` }
        } : {};

        const response = await api.get("/plants", config);
        setPlants(response.data || []);
      } catch (e) {
        const errorMsg = e?.response?.data?.message || e.message || "Failed to load plants";
        setError(errorMsg);
        console.error("Plants loading error:", e);
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      load();
    } else {
      setError("Please log in to view plant catalog");
      setLoading(false);
    }
  }, [user]);

  const getCartQuantity = (plantId) => {
    const cartItem = cartItems.find(item => item.plant._id === plantId);
    return cartItem ? cartItem.qty : 0;
  };

  const getAvailableStock = (plant) => {
    const inCart = getCartQuantity(plant._id);
    return Math.max(0, plant.stock - inCart);
  };

  const handleAddToCart = (plant, quantity = 1) => {
    if (plant.stock === 0) {
      setCartMessage(`${plant.name} is out of stock`);
      setTimeout(() => setCartMessage(""), 3000);
      return;
    }

    const currentInCart = getCartQuantity(plant._id);
    const requestedTotal = currentInCart + quantity;

    // check if requested total exceeds available stock
    if (requestedTotal > plant.stock) {
      const available = plant.stock - currentInCart;
      if (available === 0) {
        setCartMessage(`No more ${plant.name} available (${currentInCart} already in cart)`);
      } else {
        setCartMessage(`Only ${available} more ${plant.name} available (${currentInCart} already in cart)`);
      }
      setTimeout(() => setCartMessage(""), 4000);
      return;
    }

    try {
      addToCart(plant, quantity);
      setCartMessage(`Added ${quantity} ${plant.name} to cart!`);
      setTimeout(() => setCartMessage(""), 3000);
    } catch (e) {
      setError("Failed to add item to cart");
      setTimeout(() => setError(""), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading plants...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Plant Collection
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Discover our beautiful selection of plants for your home and garden
          </p>
        </div>

        {/* messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {cartMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {cartMessage}
          </div>
        )}

        {/* plants grid */}
        {!error && plants.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No plants available at the moment</div>
            <div className="text-gray-400 text-sm mt-2">Please check back later</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
            {plants.map(plant => {
              const inCart = getCartQuantity(plant._id);
              const availableStock = getAvailableStock(plant);
              const maxQuantity = Math.min(availableStock, 10); // Limit selector to 10 or available stock
              
              return (
                <div key={plant._id} className="group relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-t-lg bg-gray-200">
                    {/* placeholder for plant image */}                   
                    <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-t-lg bg-gray-200">
                      <img
                        src={`/images/plants/${plant.image || 'placeholder.jpg'}`}
                        alt={plant.name}
                        className="h-48 w-full object-cover object-center group-hover:opacity-75"
                        onError={(e) => {
                          e.target.src = '/images/plants/placeholder.jpg';
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium text-gray-900 group-hover:text-green-600 transition-colors">
                        {plant.name}
                      </h3>
                      <p className="text-lg font-semibold text-green-600">
                        ${Number(plant.price).toFixed(2)}
                      </p>
                    </div>
                    
                    {plant.category && (
                      <p className="text-sm text-gray-500 mb-2">{plant.category}</p>
                    )}
                    
                    {plant.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {plant.description}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-sm text-gray-500">
                        <span className={plant.stock <= 5 ? "text-red-500 font-medium" : ""}>
                          {plant.stock > 0 ? `${plant.stock} in stock` : "Out of stock"}
                        </span>
                        {plant.stock <= 5 && plant.stock > 0 && (
                          <span className="ml-1 text-red-500">• Low stock</span>
                        )}
                      </div>
                    </div>

                    {/* show cart status */}
                    {inCart > 0 && (
                      <div className="text-sm text-blue-600 mb-2">
                        {inCart} in cart • {availableStock} more available
                      </div>
                    )}
                    
                    {/* quantity selector for add to cart */}
                    {availableStock > 0 && (
                      <div className="flex items-center space-x-2 mb-3">
                        <label className="text-sm text-gray-600">Qty:</label>
                        <select 
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                          id={`qty-${plant._id}`}
                          disabled={availableStock === 0}
                        >
                          {[...Array(maxQuantity)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <button
                      onClick={() => {
                        if (availableStock === 0) return;
                        const qtySelect = document.getElementById(`qty-${plant._id}`);
                        const quantity = parseInt(qtySelect?.value) || 1;
                        handleAddToCart(plant, quantity);
                      }}
                      disabled={availableStock === 0}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                    >
                      {availableStock === 0 ? 
                        (plant.stock === 0 ? "Out of Stock" : "All in Cart") : 
                        "Add to Cart"
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}