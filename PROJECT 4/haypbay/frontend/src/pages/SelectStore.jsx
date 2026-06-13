import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { selectStoreAfterLogin } from "../api/authApi";
import "../pages/Auth.css";

const safeJSON = (v, fallback = null) => {
  try {
    const parsed = JSON.parse(v);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

// supports both shapes:
// { storeId, storeName } OR { _id, name }
const normalizeStores = (list) => {
  if (!Array.isArray(list)) return [];

  return list
    .map((s) => {
      if (!s) return null;

      if (s.storeId) {
        return {
          _id: String(s.storeId),
          name: s.storeName || "Store",
        };
      }

      if (s._id) {
        return {
          _id: String(s._id),
          name: s.name || s.storeName || "Store",
        };
      }

      return null;
    })
    .filter(Boolean);
};

const SelectStore = () => {
  const navigate = useNavigate();
  const [storesRaw, setStoresRaw] = useState([]);
  const [loading, setLoading] = useState(false);

  const stores = useMemo(() => normalizeStores(storesRaw), [storesRaw]);

  const redirectByRole = (roleValue) => {
    const role = String(roleValue || "").toLowerCase();

    if (role === "superadmin") return navigate("/superadmin", { replace: true });
    if (role === "admin") return navigate("/admin", { replace: true });
    if (role === "shopkeeper" || role === "ca") {
      return navigate("/shopkeeper", { replace: true });
    }
    if (role === "user") return navigate("/user", { replace: true });

    return navigate("/login", { replace: true });
  };

  const finalizeStoreSelection = async (storeId, storeName = "Store") => {
    setLoading(true);

    try {
      const result = await selectStoreAfterLogin(storeId);

      if (!result?.token || !result?.user) {
        alert("Store selection failed. Please login again.");
        return navigate("/login", { replace: true });
      }

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      localStorage.setItem(
        "activeStore",
        JSON.stringify({
          _id: String(storeId),
          name: storeName,
        })
      );

      const roleRaw =
        result.user.roleName || result.user.role?.name || result.user.role || "";

      return redirectByRole(roleRaw);
    } catch (error) {
      console.error("Store select error:", error);
      alert(
        error?.response?.data?.msg ||
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong"
      );
      return navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = safeJSON(localStorage.getItem("user"), null);
    const activeStore = safeJSON(localStorage.getItem("activeStore"), null);

    // ✅ MINIMUM FIX: agar activeStore already selected hai to dobara select page mat dikhao
    if (token && user && activeStore?._id) {
      const roleRaw = user.roleName || user.role?.name || user.role || "";
      redirectByRole(roleRaw);
      return;
    }

    const storedStores = safeJSON(localStorage.getItem("stores") || "[]", []);
    const normalized = normalizeStores(storedStores);

    if (!normalized.length) {
      navigate("/login", { replace: true });
      return;
    }

    setStoresRaw(storedStores);
  }, [navigate]);

  const handleSelect = async (storeId) => {
    const selected = stores.find((s) => String(s._id) === String(storeId));
    await finalizeStoreSelection(storeId, selected?.name || "Store");
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h3>Select Store</h3>

        {stores.map((store) => (
          <button
            key={store._id}
            onClick={() => handleSelect(store._id)}
            disabled={loading}
            style={{ marginBottom: "10px", width: "100%" }}
          >
            {store.name}
          </button>
        ))}

        {loading && <p>Loading...</p>}
      </div>
    </div>
  );
};

export default SelectStore;