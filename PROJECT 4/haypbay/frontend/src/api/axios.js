import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: API,
  withCredentials: false,
});

/* =========================
   HELPERS
========================= */
const safeJSON = (value, fallback = null) => {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const getUser = () => {
  return safeJSON(localStorage.getItem("user") || "null", null);
};

const getUserRole = () => {
  const u = getUser();
  const role = u?.roleName || u?.role?.name || u?.role || "";
  return String(role).toLowerCase();
};

const getActiveStore = () => {
  return safeJSON(localStorage.getItem("activeStore") || "null", null);
};

const getStoreId = () => {
  // 1) activeStore first
  const activeStore = getActiveStore();

  if (typeof activeStore === "string" && activeStore.trim()) {
    return activeStore.trim();
  }

  if (activeStore?._id) return String(activeStore._id);
  if (activeStore?.storeId) return String(activeStore.storeId);

  // 2) fallback user store
  const u = getUser();

  if (u?.storeId) return String(u.storeId);
  if (u?.store?._id) return String(u.store._id);
  if (u?.store?.storeId) return String(u.store.storeId);

  return "";
};

/* =========================
   REQUEST INTERCEPTOR
========================= */
api.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};

    // ✅ attach token only if missing
    const alreadyHasAuth =
      !!config.headers.Authorization || !!config.headers.authorization;

    if (!alreadyHasAuth) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    const role = getUserRole();
    const storeId = getStoreId();
    const activeStore = getActiveStore();

    /**
     * ✅ Store header rules:
     * - admin / shopkeeper / ca / user => always send if storeId exists
     * - superadmin => send only when activeStore selected
     */
    const hasActiveStore =
      !!activeStore &&
      ((typeof activeStore === "string" && activeStore.trim()) ||
        activeStore?._id ||
        activeStore?.storeId);

    const shouldSendStoreHeader =
      role !== "superadmin" ? !!storeId : !!hasActiveStore && !!storeId;

    if (shouldSendStoreHeader) {
      config.headers["x-store-id"] = storeId;
    } else {
      delete config.headers["x-store-id"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   RESPONSE INTERCEPTOR
========================= */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.warn("Unauthorized — token expired or invalid");
    }
    return Promise.reject(error);
  }
);

export default api;