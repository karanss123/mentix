import { Navigate } from "react-router-dom";

const safeJSON = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  const user = safeJSON(localStorage.getItem("user"));

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user.role || "").toLowerCase();

  // ✅ If allowedRoles defined, enforce role check
  if (allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map((r) =>
      String(r).toLowerCase()
    );

    const hasAccess =
      normalizedAllowed.includes(userRole) ||
      (userRole === "superadmin" &&
        normalizedAllowed.includes("admin")); 
        // superadmin can access admin routes

    if (!hasAccess) {
      // redirect based on role
      if (userRole === "superadmin")
        return <Navigate to="/superadmin" replace />;

      if (userRole === "admin")
        return <Navigate to="/admin" replace />;

      if (userRole === "shopkeeper")
        return <Navigate to="/shopkeeper" replace />;

      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;