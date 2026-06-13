import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const store = JSON.parse(localStorage.getItem("activeStore") || "null");

        const { data } = await axios.get("https://mentix-cg1j.onrender.com/api/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-store-id": store?._id,
          },
        });

        setOrders(data);
      } catch (error) {
        console.error("Admin Orders Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleStatusChange = async (newStatus) => {
    if (!selectedOrder?._id) return;

    try {
      setUpdating(true);

      const token = localStorage.getItem("token");
      const store = JSON.parse(localStorage.getItem("activeStore") || "null");

      const { data } = await axios.put(
        `https://mentix-cg1j.onrender.com/api/orders/${selectedOrder._id}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-store-id": store?._id,
          },
        }
      );

      const updatedOrder = data.order;

      setSelectedOrder(updatedOrder);

      setOrders((prev) =>
        prev.map((order) =>
          order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order
        )
      );
    } catch (error) {
      console.error("Status update error:", error);
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusStyle = (status) => {
    if (status === "Delivered") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (status === "Cancelled") {
      return {
        background: "#fee2e2",
        color: "#991b1b",
      };
    }

    if (status === "Shipped") {
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
      };
    }

    if (status === "Confirmed") {
      return {
        background: "#ede9fe",
        color: "#6d28d9",
      };
    }

    return {
      background: "#fef3c7",
      color: "#92400e",
    };
  };

  const getPaidStyle = (isPaid) => {
    return isPaid
      ? {
          background: "#dcfce7",
          color: "#166534",
        }
      : {
          background: "#fee2e2",
          color: "#991b1b",
        };
  };

  const getPaymentStyle = (method) => {
    if (method === "ONLINE") {
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
      };
    }

    return {
      background: "#f3f4f6",
      color: "#374151",
    };
  };

  const getPaymentStatusStyle = (status) => {
    if (status === "paid") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (status === "pending") {
      return {
        background: "#fef3c7",
        color: "#92400e",
      };
    }

    if (status === "failed") {
      return {
        background: "#fee2e2",
        color: "#991b1b",
      };
    }

    if (status === "refunded") {
      return {
        background: "#ede9fe",
        color: "#6d28d9",
      };
    }

    return {
      background: "#f3f4f6",
      color: "#374151",
    };
  };

  const columns = useMemo(
    () => [
      {
        name: "Customer",
        selector: (row) => row.user?.name || "N/A",
        sortable: true,
      },
      {
        name: "Email",
        selector: (row) => row.user?.email || "N/A",
        wrap: true,
      },
      {
        name: "Products",
        selector: (row) =>
          row.orderItems?.map((item) => item.name).join(", ") || "N/A",
        wrap: true,
        grow: 2,
      },
      {
        name: "Total",
        selector: (row) => `₹${row.totalPrice}`,
        sortable: true,
      },
      {
        name: "Payment",
        cell: (row) => {
          const style = getPaymentStyle(row.paymentMethod);

          return (
            <span
              style={{
                ...style,
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              {row.paymentMethod || "COD"}
            </span>
          );
        },
      },
      {
        name: "Paid",
        cell: (row) => {
          const style = getPaidStyle(row.isPaid);

          return (
            <span
              style={{
                ...style,
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              {row.isPaid ? "Paid" : "Unpaid"}
            </span>
          );
        },
      },
      {
        name: "Payment Status",
        cell: (row) => {
          const style = getPaymentStatusStyle(row.paymentStatus);

          return (
            <span
              style={{
                ...style,
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {row.paymentStatus || "pending"}
            </span>
          );
        },
      },
      {
        name: "Status",
        cell: (row) => {
          const style = getStatusStyle(row.status);

          return (
            <span
              style={{
                ...style,
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              {row.status}
            </span>
          );
        },
      },
      {
        name: "Date",
        selector: (row) =>
          row.createdAt
            ? new Date(row.createdAt).toLocaleDateString()
            : "N/A",
        sortable: true,
      },
      {
        name: "Action",
        cell: (row) => (
          <button
            onClick={() => setSelectedOrder(row)}
            style={{
              background: "#111827",
              color: "#fff",
              border: "none",
              padding: "8px 12px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            View
          </button>
        ),
      },
    ],
    []
  );

  const closeModal = () => setSelectedOrder(null);

  return (
    <div style={{ padding: "24px", background: "#f8fafc", minHeight: "100vh" }}>
      <h2 style={{ marginBottom: "18px", fontSize: "28px", fontWeight: "700" }}>
        All Orders
      </h2>

      <div
        style={{
          background: "#fff",
          borderRadius: "14px",
          overflow: "hidden",
          border: "1px solid #e5e7eb",
        }}
      >
        <DataTable
          columns={columns}
          data={orders}
          progressPending={loading}
          pagination
          highlightOnHover
          striped
          responsive
          noDataComponent="No orders found"
        />
      </div>

      {selectedOrder && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "18px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "24px", fontWeight: "700" }}>
                Order Details
              </h3>

              <button
                onClick={closeModal}
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Close
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr",
                gap: "16px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  background: "#f9fafb",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <h4 style={{ marginTop: 0, marginBottom: "10px" }}>
                  Customer Info
                </h4>

                <p>
                  <strong>Name:</strong> {selectedOrder.user?.name || "N/A"}
                </p>

                <p>
                  <strong>Email:</strong> {selectedOrder.user?.email || "N/A"}
                </p>

                <p>
                  <strong>Payment Method:</strong>{" "}
                  <span
                    style={{
                      ...getPaymentStyle(selectedOrder.paymentMethod),
                      padding: "4px 10px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {selectedOrder.paymentMethod || "COD"}
                  </span>
                </p>

                <p>
                  <strong>Payment Status:</strong>{" "}
                  <span
                    style={{
                      ...getPaymentStatusStyle(selectedOrder.paymentStatus),
                      padding: "4px 10px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: "600",
                      textTransform: "capitalize",
                    }}
                  >
                    {selectedOrder.paymentStatus || "pending"}
                  </span>
                </p>

                <p>
                  <strong>Paid:</strong>{" "}
                  <span
                    style={{
                      ...getPaidStyle(selectedOrder.isPaid),
                      padding: "4px 10px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {selectedOrder.isPaid ? "Yes" : "No"}
                  </span>
                </p>

                {selectedOrder.paidAt && (
                  <p>
                    <strong>Paid At:</strong>{" "}
                    {new Date(selectedOrder.paidAt).toLocaleString()}
                  </p>
                )}

                {selectedOrder.paymentId && (
                  <p>
                    <strong>Payment ID:</strong> {selectedOrder.paymentId}
                  </p>
                )}

                <div style={{ marginBottom: "10px" }}>
                  <strong>Status:</strong>

                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updating}
                    style={{
                      marginLeft: "10px",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <p>
                  <strong>Date:</strong>{" "}
                  {selectedOrder.createdAt
                    ? new Date(selectedOrder.createdAt).toLocaleDateString()
                    : "N/A"}
                </p>

                <p>
                  <strong>Total:</strong> ₹{selectedOrder.totalPrice}
                </p>
              </div>

              <div
                style={{
                  background: "#f9fafb",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <h4 style={{ marginTop: 0, marginBottom: "10px" }}>
                  Delivery Address
                </h4>

                <p>{selectedOrder.shippingAddress?.name || "-"}</p>
                <p>{selectedOrder.shippingAddress?.phone || "-"}</p>
                <p>
                  {selectedOrder.shippingAddress?.address || "-"},{" "}
                  {selectedOrder.shippingAddress?.city || "-"} -{" "}
                  {selectedOrder.shippingAddress?.pincode || "-"}
                </p>
              </div>
            </div>

            <div
              style={{
                background: "#f9fafb",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                marginBottom: "18px",
              }}
            >
              <h4 style={{ marginTop: 0, marginBottom: "10px" }}>
                Price Details
              </h4>

              <p>
                <strong>Items Price:</strong> ₹{selectedOrder.itemsPrice ?? 0}
              </p>

              <p>
                <strong>GST:</strong> ₹{selectedOrder.gstAmount ?? 0}
              </p>

              <p>
                <strong>Platform Fee:</strong> ₹{selectedOrder.platformFee ?? 0}
              </p>

              <p>
                <strong>Delivery Fee:</strong> ₹{selectedOrder.deliveryFee ?? 0}
              </p>

              <p>
                <strong>Total:</strong> ₹{selectedOrder.totalPrice ?? 0}
              </p>
            </div>

            <div
              style={{
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "14px 16px",
                  fontWeight: "700",
                  background: "#f3f4f6",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Ordered Items
              </div>

              {selectedOrder.orderItems?.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 100px 120px",
                    padding: "14px 16px",
                    borderBottom:
                      i !== selectedOrder.orderItems.length - 1
                        ? "1px solid #e5e7eb"
                        : "none",
                    alignItems: "center",
                    background: i % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <div>
                    {item.name}
                    {item.size ? ` (${item.size})` : ""}
                  </div>

                  <div>Qty: {item.qty}</div>

                  <div style={{ textAlign: "right", fontWeight: "600" }}>
                    ₹{item.price * item.qty}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;