import { useEffect, useState } from "react";
import axios from "axios";
import "./styles.css";

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const store = JSON.parse(localStorage.getItem("activeStore") || "null");

        const { data } = await axios.get(
          "https://mentix-cg1j.onrender.com/api/orders/my",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "x-store-id": store?._id,
            },
          }
        );

        setOrders(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleCancelOrder = async (id) => {
    if (!window.confirm("Cancel order?")) return;

    try {
      setCancellingId(id);

      const token = localStorage.getItem("token");
      const store = JSON.parse(localStorage.getItem("activeStore") || "null");

      const { data } = await axios.put(
        `https://mentix-cg1j.onrender.com/api/orders/${id}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-store-id": store?._id,
          },
        }
      );

      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, ...data.order } : o))
      );
    } catch {
      alert("Cancel failed");
    } finally {
      setCancellingId("");
    }
  };

  if (loading) return <p className="orders-loading">Loading...</p>;

  return (
    <div className="orders-wrapper">
      <h1 className="orders-heading">Your Orders</h1>

      {orders.map((order) => (
        <div key={order._id} className="order-glass">

          {/* LEFT TIMELINE */}
          <div className="order-status-line">
            <div className={`dot ${order.status.toLowerCase()}`} />
            <span>{order.status}</span>
          </div>

          {/* RIGHT CONTENT */}
          <div className="order-content">

            <div className="order-top">
              <h3>
                {order.orderItems.map((i) => i.name).join(", ")}
              </h3>
              <p>₹{order.totalPrice}</p>
            </div>

            <p className="order-date">
              {new Date(order.createdAt).toLocaleString()}
            </p>

            {/* ITEMS */}
            <div className="order-items">
              {order.orderItems.map((item, i) => (
                <div key={i} className="item-row">
                  <span>
                    {item.name} ({item.size || "M"}) × {item.qty}
                  </span>
                  <span>₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>

            {/* ADDRESS */}
            <div className="order-address">
              <p>{order.shippingAddress?.name}</p>
              <p>{order.shippingAddress?.city}</p>
            </div>

            {/* BUTTON */}
            {(order.status === "Pending" ||
              order.status === "Confirmed") && (
              <button
                className="cancel-btn"
                onClick={() => handleCancelOrder(order._id)}
              >
                {cancellingId === order._id
                  ? "Cancelling..."
                  : "Cancel Order"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyOrdersPage;