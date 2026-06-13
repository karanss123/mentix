import { NavLink } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useStore } from "../../context/StoreContext";
import "./admin.css";

const safeGetUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const safeJSON = (v, fallback = null) => {
  try {
    const parsed = JSON.parse(v);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const normalizeStoresList = (list) => {
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

const Sidebar = () => {
  const user = safeGetUser();
  const { stores, setStores, activeStore, setActiveStore } = useStore();

  const role = useMemo(() => {
    const r = user?.roleName || user?.role?.name || user?.role || "";
    return String(r).toLowerCase();
  }, [user]);

  const isSuperAdmin = role === "superadmin";
  const isAdmin = role === "admin";
  const isShopLike = role === "shopkeeper" || role === "ca";

  const basePath = isSuperAdmin ? "/superadmin" : isAdmin ? "/admin" : "/shopkeeper";

  const persistActiveStore = (storeObj) => {
    if (storeObj?._id) {
      localStorage.setItem("activeStore", JSON.stringify(storeObj));
    } else {
      localStorage.removeItem("activeStore");
    }
  };

  // Restore stores list from localStorage
  useEffect(() => {
    const lsStoresRaw = safeJSON(localStorage.getItem("stores") || "[]", []);
    const list = normalizeStoresList(lsStoresRaw);
    setStores(list);
  }, [setStores]);

  // Restore activeStore from localStorage
  useEffect(() => {
    const savedActive = safeJSON(localStorage.getItem("activeStore") || "null", null);
    if (savedActive?._id) {
      setActiveStore(savedActive);
    }
  }, [setActiveStore]);

  // Admin: ensure one valid store is selected
  useEffect(() => {
    if (!isAdmin) return;

    const lsStoresRaw = safeJSON(localStorage.getItem("stores") || "[]", []);
    const list = normalizeStoresList(lsStoresRaw);

    if (!list.length) return;

    const savedActive = safeJSON(localStorage.getItem("activeStore") || "null", null);

    const restored =
      savedActive?._id && list.find((s) => String(s._id) === String(savedActive._id))
        ? list.find((s) => String(s._id) === String(savedActive._id))
        : null;

    const pick = restored || list[0];

    if (pick?._id) {
      setActiveStore(pick);
      persistActiveStore(pick);
    }
  }, [isAdmin, setActiveStore]);

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">
        {isSuperAdmin ? "SuperAdmin" : "Dashboard"}
      </h2>

      <ul className="sidebar-menu">
        {isSuperAdmin ? (
          <>
            <li>
              <NavLink
                to="/superadmin/stores"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Stores
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/superadmin/create-admin"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Create Store Admin
              </NavLink>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink
                to={`${basePath}/profile`}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Profile
              </NavLink>
            </li>
            {isAdmin && (
  <li>
    <NavLink
      to={`${basePath}/store-settings`}
      className={({ isActive }) => (isActive ? "active" : "")}
    >
      Store Settings
    </NavLink>
  </li>
)}

            {(isAdmin || isShopLike) && (
              <li>
                <NavLink
                  to={`${basePath}/categories`}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Categories
                </NavLink>
              </li>
            )}

            {(isAdmin || isShopLike) && (
              <li>
                <NavLink
                  to={`${basePath}/products`}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Products
                </NavLink>
              </li>
            )}

            {(isAdmin || isShopLike) && (
              <li>
                <NavLink
                  to={`${basePath}/orders`}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Orders
                </NavLink>
              </li>
            )}
            {(isAdmin || isShopLike) && (
  <li>
    <NavLink
      to={`${basePath}/contacts`}
      className={({ isActive }) => (isActive ? "active" : "")}
    >
      Contact Messages
    </NavLink>
  </li>
)}

            {isAdmin && (
              <>
                <li>
                  <NavLink
                    to="/admin/roles"
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Roles
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/admin/permissions"
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Permissions
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/admin/users"
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Users
                  </NavLink>
                </li>
              </>
            )}
          </>
        )}
      </ul>

      {!isSuperAdmin && (
        <div className="sidebar-footer">
          <div className="store-label">Store</div>

          {isAdmin ? (
            stores.length > 0 ? (
              <select
                className="store-select"
                value={activeStore?._id || ""}
                onChange={(e) => {
                  const selected = stores.find(
                    (s) => String(s._id) === String(e.target.value)
                  );
                  if (!selected) return;

                  setActiveStore(selected);
                  persistActiveStore(selected);

                  window.location.reload();
                }}
              >
                <option value="" disabled>
                  Select Store
                </option>
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="store-badge">No stores</div>
            )
          ) : (
            <div className="store-badge">
              {activeStore?.name || "Selected Store"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;