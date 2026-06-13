import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../pages/styles.css";

const CartPage = () => {
  const navigate = useNavigate();

  const {
    cartItems,
    removeFromCart,
    increaseQty,
    decreaseQty,
    cartSubtotal,
    gst,
    platformFee,
    deliveryFee,
    cartTotal,
  } = useCart();

  return (
    <div className="cart-container">
      <h2 className="cart-title">My Cart</h2>

      {cartItems.length === 0 ? (
        <p className="cart-empty">Your cart is empty 🛒</p>
      ) : (
        <div className="cart-wrapper">

          {/* LEFT: ITEMS */}
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item._id} className="cart-card">

                <img
                  src={item.image}
                  alt={item.name}
                  className="cart-img"
                />

                <div className="cart-info">
                  <h3>{item.name}</h3>

                  {item.size && <p className="cart-size">Size: {item.size}</p>}

                  <p className="cart-price">₹{item.price}</p>

                  <div className="qty-box">
                    <button onClick={() => decreaseQty(item._id)}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => increaseQty(item._id)}>+</button>
                  </div>
                </div>

                <div className="cart-right">
                  <h3>₹{item.price * item.qty}</h3>

                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* RIGHT: PRICE BOX */}
          <div className="price-box">
            <h3>Price Details</h3>

            <div className="price-row">
              <span>Subtotal</span>
              <span>₹{cartSubtotal}</span>
            </div>

            <div className="price-row">
              <span>GST (5%)</span>
              <span>₹{gst.toFixed(2)}</span>
            </div>

            <div className="price-row">
              <span>Platform Fee</span>
              <span>₹{platformFee}</span>
            </div>

            <div className="price-row">
              <span>Delivery</span>
              <span>
                ₹{deliveryFee}{" "}
                {deliveryFee === 0 && (
                  <span className="free-delivery">FREE</span>
                )}
              </span>
            </div>

            <hr />

            <div className="price-total">
              <span>Total</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="checkout-btn"
            >
              Proceed to Checkout →
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default CartPage;