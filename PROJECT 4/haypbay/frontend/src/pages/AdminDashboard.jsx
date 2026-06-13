import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../component/admin/AdminLayout";

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
      navigate("/login", { replace: true });
      return;
    }

    // Admin-only access
    const allowedRoles = ["admin"];
    if (!allowedRoles.includes(user.role)) {
      console.warn("Access denied: Admins only");
      navigate("/", { replace: true });
    }
  }, [navigate]);

  return <AdminLayout />;
};

export default AdminDashboard;
