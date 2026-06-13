import { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";

const StoreContext = createContext(null);

const safeJSON = (value, fallback = null) => {
  try {
    const v = JSON.parse(value);
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const normalizeStore = (store) => {
  if (!store) return null;

  if (typeof store === "string") return { _id: String(store), name: "Store" };

  if (typeof store === "object") {
    if (store._id) return { ...store, _id: String(store._id) };
    if (store.storeId) return { ...store, _id: String(store.storeId) };
  }

  return null;
};

export function StoreProvider({ children }) {
  const [stores, setStoresState] = useState(() =>
    safeJSON(localStorage.getItem("stores"), [])
  );

  const [activeStore, setActiveStoreState] = useState(() =>
    normalizeStore(safeJSON(localStorage.getItem("activeStore"), null))
  );

  const setStores = useCallback((list) => {
    const arr = Array.isArray(list) ? list : [];
    localStorage.setItem("stores", JSON.stringify(arr));
    setStoresState(arr);
  }, []);

  const setActiveStore = useCallback((storeOrId) => {
    const normalized = normalizeStore(storeOrId);

    if (normalized?._id) {
      localStorage.setItem("activeStore", JSON.stringify(normalized));
    } else {
      localStorage.removeItem("activeStore");
    }

    setActiveStoreState(normalized);
  }, []);

  // ✅ One-time: shopkeeper/ca refresh safety
  useEffect(() => {
    const user = safeJSON(localStorage.getItem("user"), null);
    const roleRaw = user?.roleName || user?.role?.name || user?.role || "";
    const role = String(roleRaw).toLowerCase();

    const isAdminLike = role === "admin" || role === "superadmin";
    const isShopLike = role === "shopkeeper" || role === "ca";

    if (!isAdminLike && isShopLike && user?.storeId) {
      const saved = normalizeStore(safeJSON(localStorage.getItem("activeStore"), null));
      if (!saved?._id) {
        setActiveStore({ _id: String(user.storeId), name: "Selected" });
      }
    }
  }, [setActiveStore]);

  // ✅ MINIMUM FIX: localStorage se activeStore restore kar lo
  useEffect(() => {
    if (!activeStore?._id) {
      const saved = normalizeStore(
        safeJSON(localStorage.getItem("activeStore"), null)
      );

      if (saved?._id) {
        setActiveStoreState(saved);
      }
    }
  }, [activeStore]);

  const value = useMemo(
    () => ({
      stores,
      setStores,
      activeStore,
      setActiveStore,
    }),
    [stores, setStores, activeStore, setActiveStore]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}