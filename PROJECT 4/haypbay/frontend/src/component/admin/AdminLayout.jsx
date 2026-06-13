import { Outlet, Navigate } from "react-router-dom";
import { useMemo } from "react";
import Sidebar from "./Sidebar";
import "./admin.css";

const safeGetUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const safeGetActiveStore = () => {
  try {
    return JSON.parse(localStorage.getItem("activeStore") || "null");
  } catch {
    return null;
  }
};

const AdminLayout = () => {
  const token = localStorage.getItem("token");
  const user = safeGetUser();
  const activeStore = safeGetActiveStore();

  const storeKey = activeStore?._id || "no-store";

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = useMemo(() => {
    const r = user?.roleName || user?.role?.name || user?.role || "";
    return String(r).toLowerCase();
  }, [user]);

  if (!["superadmin", "admin", "shopkeeper", "ca"].includes(role)) {
    return <Navigate to="/login" replace />;
  }

  // ✅ localStorage se check karo, context se nahi
  if (role !== "superadmin" && !activeStore?._id) {
    return <Navigate to="/select-store" replace />;
  }

  return (
    <div className="admin-layout">
      <Sidebar />

      <div className="admin-content">
        <main className="admin-main">
          <Outlet key={storeKey} />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;