// ===============================
// AUTH API + COMMON FETCH WRAPPER
// ===============================

// ✅ Base API (without trailing slash)
const API_ROOT = import.meta?.env?.VITE_API_URL || "http://localhost:4000";

// ✅ Auth endpoints base
const AUTH_BASE_URL = `${API_ROOT}/api/auth`;

// ===============================
// COMMON RESPONSE HANDLER
// ===============================
const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.msg || data.message || "Something went wrong");
  }
  return data;
};

// ===============================
// STORE HELPERS
// ===============================
export const getActiveStoreId = () => {
  try {
    const store = JSON.parse(localStorage.getItem("activeStore") || "null");
    return store?._id || "";
  } catch {
    return "";
  }
};

export const setActiveStore = (store) => {
  if (!store) {
    localStorage.removeItem("activeStore");
    return;
  }

  if (typeof store === "string") {
    localStorage.setItem("activeStore", JSON.stringify({ _id: store }));
    return;
  }

  if (store?._id) {
    localStorage.setItem(
      "activeStore",
      JSON.stringify({
        _id: store._id,
        name: store.name || store.storeName || "Store",
      })
    );
  }
};

// ===============================
// TEMP TOKEN HELPERS
// ===============================
export const setStoreSelectToken = (token) => {
  if (!token) {
    localStorage.removeItem("storeSelectToken");
    return;
  }
  localStorage.setItem("storeSelectToken", token);
};

export const getStoreSelectToken = () =>
  localStorage.getItem("storeSelectToken") || "";

// ===============================
// AUTH HELPERS
// ===============================
export const getToken = () => localStorage.getItem("token");

export const getLoggedInUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const getUserRole = () => {
  const user = getLoggedInUser();
  return user ? String(user.role || "").toLowerCase() : null;
};

export const isLoggedIn = () => !!localStorage.getItem("token");

// ===============================
// AUTH FETCH WRAPPER
// - Adds Authorization token
// - Adds x-store-id from activeStore
// ===============================
export const authFetch = async (path, options = {}) => {
  const url = path.startsWith("http") ? path : `${API_ROOT}${path}`;

  const token = localStorage.getItem("token");
  const storeId = getActiveStoreId();

  const headers = {
    ...(options.headers || {}),
  };

  if (!headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const role = String(getUserRole() || "").toLowerCase();
  const shouldSendStoreHeader =
    role !== "superadmin" || (role === "superadmin" && !!storeId);

  if (shouldSendStoreHeader && storeId) {
    headers["x-store-id"] = storeId;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  return handleResponse(res);
};

// ===============================
// REGISTER
// ✅ normal user backend now global
// frontend se storeId optional hi rakha
// ===============================
export const registerUser = async (data, storeId = "") => {
  const headers = { "Content-Type": "application/json" };
  if (storeId) headers["x-store-id"] = storeId;

  const res = await fetch(`${AUTH_BASE_URL}/register`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  return handleResponse(res);
};

// ===============================
// VERIFY OTP
// ===============================
export const verifyOtp = async (data, storeId = "") => {
  const headers = { "Content-Type": "application/json" };
  if (storeId) headers["x-store-id"] = storeId;

  const res = await fetch(`${AUTH_BASE_URL}/verify-otp`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  return handleResponse(res);
};

// ===============================
// LOGIN
// - If backend returns needsStore:true
//   save tempToken + stores only
// - Else save final token/user
// ===============================
export const loginUser = async (data, storeId = "") => {
  const headers = { "Content-Type": "application/json" };
  if (storeId) headers["x-store-id"] = storeId;

  const res = await fetch(`${AUTH_BASE_URL}/login`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  const result = await handleResponse(res);

  // ✅ store selection required
  if (result?.needsStore) {
    if (Array.isArray(result?.stores)) {
      localStorage.setItem("stores", JSON.stringify(result.stores));
    } else {
      localStorage.removeItem("stores");
    }

    setStoreSelectToken(result?.tempToken || "");

    // old final auth clear
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeStore");

    return result;
  }

  // ✅ normal direct login
  if (result?.token) localStorage.setItem("token", result.token);
  if (result?.user) localStorage.setItem("user", JSON.stringify(result.user));

  setStoreSelectToken("");

  const role = String(result?.user?.role || "").toLowerCase();

  if (role === "superadmin") {
    localStorage.removeItem("activeStore");
    localStorage.removeItem("stores");
  } else if (result?.user?.storeId) {
    setActiveStore(result.user.storeId);
  } else {
    localStorage.removeItem("activeStore");
  }

  return result;
};

// ===============================
// SELECT STORE AFTER LOGIN
// - uses tempToken
// - returns final token + user
// ===============================
export const selectStoreAfterLogin = async (storeId) => {
  const tempToken = getStoreSelectToken();

  if (!tempToken) {
    throw new Error("Store select token missing. Please login again.");
  }

  if (!storeId) {
    throw new Error("storeId is required");
  }

  const res = await fetch(`${AUTH_BASE_URL}/select-store`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tempToken}`,
    },
    body: JSON.stringify({ storeId }),
  });

  const result = await handleResponse(res);

  if (result?.token) localStorage.setItem("token", result.token);
  if (result?.user) localStorage.setItem("user", JSON.stringify(result.user));

  // selected store should become active store
  setActiveStore({
    _id: storeId,
    name: "",
  });

  setStoreSelectToken("");

  return result;
};

// ===============================
// LOGOUT
// ===============================
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("stores");
  localStorage.removeItem("activeStore");
  localStorage.removeItem("storeSelectToken");
};