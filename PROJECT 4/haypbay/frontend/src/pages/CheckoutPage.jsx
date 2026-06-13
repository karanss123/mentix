import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../pages/styles.css";

const CheckoutPage = () => {
  const navigate = useNavigate();

  const {
    cartItems,
    cartSubtotal,
    gst,
    platformFee,
    deliveryFee,
    cartTotal,
    clearCart,
  } = useCart();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePlaceOrder = async () => {
    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.pincode.trim()
    ) {
      alert("Please fill all fields");
      return;
    }

    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    const token = localStorage.getItem("token");
    const store = JSON.parse(localStorage.getItem("activeStore") || "null");

    if (!token) return alert("Login required");
    if (!store?._id) return alert("Store not selected");

    try {
      setLoading(true);

      const cleanItems = cartItems.map((item) => ({
        productId: item.productId || item._id,
        name: item.name,
        image: item.image,
        price: Number(item.price),
        qty: Number(item.qty),
        size: item.size || "",
      }));

      if (paymentMethod === "ONLINE") {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        alert("Payment Successful ✅");
      }

      await axios.post(
        "http://localhost:4000/api/orders",
        {
          items: cleanItems,
          shippingAddress: form,
          paymentMethod,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-store-id": store._id,
          },
        }
      );

      alert("Order Placed Successfully ✅");
      clearCart();
      navigate("/my-orders");
    } catch (error) {
      console.error(error);
      alert("Order Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <h2 className="checkout-title">Checkout</h2>

      {cartItems.length === 0 ? (
        <p className="cart-empty">Your cart is empty</p>
      ) : (
        <div className="checkout-wrapper">

          {/* LEFT */}
          <div className="checkout-left">
            <h3>Delivery Address</h3>

            <input name="name" placeholder="Full Name" onChange={handleChange} />
            <input name="phone" placeholder="Phone Number" onChange={handleChange} />
            <textarea name="address" placeholder="Address" rows={4} onChange={handleChange} />
            <input name="city" placeholder="City" onChange={handleChange} />
            <input name="pincode" placeholder="Pincode" onChange={handleChange} />

            <h3 className="payment-title">Payment Method</h3>

            <label className="radio-box">
              <input
                type="radio"
                value="COD"
                checked={paymentMethod === "COD"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              Cash on Delivery
            </label>

            <label className="radio-box">
              <input
                type="radio"
                value="ONLINE"
                checked={paymentMethod === "ONLINE"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              Online Payment
            </label>

            {paymentMethod === "ONLINE" && (
              <p className="payment-note">
                Demo payment enabled (auto success)
              </p>
            )}
          </div>

          {/* RIGHT */}
          <div className="checkout-right">
            <h3>Order Summary</h3>

            {cartItems.map((item) => (
              <div key={item._id} className="summary-row">
                <span>
                  {item.name} × {item.qty}
                </span>
                <span>₹{item.price * item.qty}</span>
              </div>
            ))}

            <hr />

            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{cartSubtotal}</span>
            </div>

            <div className="summary-row">
              <span>GST</span>
              <span>₹{gst.toFixed(2)}</span>
            </div>

            <div className="summary-row">
              <span>Platform Fee</span>
              <span>₹{platformFee}</span>
            </div>

            <div className="summary-row">
              <span>Delivery</span>
              <span>
                ₹{deliveryFee}{" "}
                {deliveryFee === 0 && <span className="free">FREE</span>}
              </span>
            </div>

            <hr />

            <div className="summary-total">
              <span>Total</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="place-order-btn"
            >
              {loading
                ? "Processing..."
                : paymentMethod === "ONLINE"
                ? "Pay & Place Order"
                : "Place Order"}
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default CheckoutPage;