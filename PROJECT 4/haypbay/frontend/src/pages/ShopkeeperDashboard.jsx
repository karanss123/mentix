import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ShopkeeperDashboard = () => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user"));

        // 🔐 Token & role check
        if (!token || !user) {
          navigate("/login", { replace: true });
          return;
        }

        if (user.role !== "shopkeeper" && user.role !== "admin") {
          alert("Access denied: Only shopkeeper or admin can access this page");
          navigate("/", { replace: true });
          return;
        }

        const res = await fetch("https://mentix-cg1j.onrender.com/api/shopkeeper/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Error fetching dashboard");

        setMessage(data.message);
      } catch (err) {
        setMessage(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="admin-content">
      <h2>Shopkeeper/Admin Dashboard</h2>
      <p>{message}</p>
    </div>
  );
};

export default ShopkeeperDashboard;
