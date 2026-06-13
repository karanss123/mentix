import { useState, useEffect } from "react";
import {
  loginUser,
  selectStoreAfterLogin,
  setStoreSelectToken,
} from "../api/authApi";
import { useNavigate } from "react-router-dom";
import "../pages/Auth.css";

const safeJSON = (v, fallback = null) => {
  try {
    const parsed = JSON.parse(v);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const normalizeStores = (list) => {
  if (!Array.isArray(list)) return [];
  return list
    .map((s) => {
      if (!s) return null;
      const id = s.storeId || s._id;
      if (!id) return null;
      return {
        storeId: String(id),
        storeName: s.storeName || s.name || "Store",
      };
    })
    .filter(Boolean);
};

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const user = safeJSON(localStorage.getItem("user"));

  const redirectByRole = (roleValue) => {
    const role = String(roleValue || "").toLowerCase();

    if (role === "superadmin") return navigate("/superadmin", { replace: true });
    if (role === "admin") return navigate("/admin", { replace: true });
    if (role === "shopkeeper" || role === "ca") {
      return navigate("/shopkeeper", { replace: true });
    }

    // ✅ user ko hamesha select-store
    if (role === "user") return navigate("/select-store", { replace: true });

    return navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (token && (user?.roleName || user?.role)) {
      const roleRaw = user.roleName || user.role?.name || user.role || "";
      const role = String(roleRaw).toLowerCase();

      // ✅ existing logged-in user ke liye bhi same rule
      if (role === "user") {
        return navigate("/select-store", { replace: true });
      }

      redirectByRole(roleRaw);
    }
    // eslint-disable-next-line
  }, [token]);

  const submitLogin = async () => {
    setLoading(true);
    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };

      const data = await loginUser(payload);
      console.log("LOGIN RESPONSE =>", data);

      if (data?.needsStore) {
        const storesList = normalizeStores(data?.stores || []);
        localStorage.setItem("stores", JSON.stringify(storesList));
        setStoreSelectToken(data?.tempToken || "");
        localStorage.removeItem("activeStore");
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // ✅ user ko hamesha select-store dikhao
        if (storesList.length > 0) {
          return navigate("/select-store", { replace: true });
        }

        alert("No stores returned by backend for this user.");
        return navigate("/login", { replace: true });
      }

      if (!data?.token || !data?.user) {
        alert(data?.msg || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setStoreSelectToken("");

      const storesList = normalizeStores(data?.stores || data?.user?.stores || []);
      localStorage.setItem("stores", JSON.stringify(storesList));

      const roleRaw =
        data.user.roleName || data.user.role?.name || data.user.role || "";
      const role = String(roleRaw || "").toLowerCase();

      // ✅ sirf USER ke liye always selection page
      if (role === "user") {
        localStorage.removeItem("activeStore");
        return navigate("/select-store", { replace: true });
      }

      // ✅ admin / shopkeeper / superadmin same as before
      if (storesList.length === 1) {
        const only = storesList[0];
        localStorage.setItem(
          "activeStore",
          JSON.stringify({ _id: only.storeId, name: only.storeName })
        );
      } else {
        localStorage.removeItem("activeStore");
      }

      redirectByRole(roleRaw);
    } catch (error) {
      console.error("Login error:", error);
      alert(
        error?.response?.data?.msg ||
          error?.response?.data?.message ||
          error?.message ||
          "Something Went Wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h3>Login</h3>

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button onClick={submitLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
};

export default Login;