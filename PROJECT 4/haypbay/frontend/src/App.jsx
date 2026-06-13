import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import SelectStore from "./pages/SelectStore.jsx";
import Home from "./pages/Home.jsx";
import CategoryProducts from "./pages/CategoryProducts.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";

import AdminLayout from "./component/admin/AdminLayout.jsx";
import AdminProfile from "./component/admin/AdminProfile.jsx";
import StoreSettings from "./component/admin/StoreSettings.jsx";
import Categories from "./component/admin/Categories.jsx";
import Products from "./component/admin/Products.jsx";
import UsersPage from "./component/admin/UserPage.jsx";
import Dashboard from "./component/admin/Dashboard.jsx";
import Navbar from "./component/Navbar.jsx";
import Footer from "./component/footer.jsx";

import Role from "./component/admin/Roles.jsx";
import Permissions from "./component/admin/Permissions.jsx";
import AdminOrders from "./component/admin/AdminOrders.jsx";
import ContactMessages from "./component/admin/ContactMessages.jsx";

import Stores from "./component/superadmin/Stores.jsx";
import CreateStoreAdmin from "./component/superadmin/CreateStoreAdmin.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import MyOrdersPage from "./pages/MyOrdersPage";
import Search from "./pages/Search.jsx";
import Contact from "./pages/Contact.jsx";

/* ============================
   HELPERS
============================ */

const safeGetUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const getActiveStoreId = () => {
  try {
    const raw = JSON.parse(localStorage.getItem("activeStore") || "null");

    if (!raw) return "";

    if (typeof raw === "string") return raw;
    if (raw._id) return String(raw._id);
    if (raw.storeId) return String(raw.storeId);

    return "";
  } catch {
    return "";
  }
};

/* ============================
   AUTH CHECK
============================ */

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem("token");
  const user = safeGetUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/* ============================
   STORE CHECK
============================ */

const RequireStoreSelected = ({ children }) => {
  const user = safeGetUser();
  const role = String(
    user?.roleName || user?.role?.name || user?.role || ""
  ).toLowerCase();

  const activeStoreId = getActiveStoreId();

  if (role === "superadmin") return children;

  const stores = (() => {
    try {
      return JSON.parse(localStorage.getItem("stores") || "[]");
    } catch {
      return [];
    }
  })();

  if (!activeStoreId && (!Array.isArray(stores) || stores.length === 0)) {
    return <Navigate to="/select-store" replace />;
  }

  return children;
};

/* ============================
   ROLE CHECK
============================ */

const RequireRole = ({ allowed = [], children }) => {
  const user = safeGetUser();
  const role = String(
    user?.roleName || user?.role?.name || user?.role || ""
  ).toLowerCase();

  const allowedRoles = allowed.map((x) => String(x).toLowerCase());

  const hasAccess =
    allowedRoles.includes(role) ||
    (role === "superadmin" && allowedRoles.includes("admin"));

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/* ============================
   ROLE HOME REDIRECT
============================ */

const RoleHomeRedirect = () => {
  const user = safeGetUser();
  const role = String(
    user?.roleName || user?.role?.name || user?.role || ""
  ).toLowerCase();

  if (role === "superadmin") return <Navigate to="/superadmin" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "shopkeeper" || role === "ca") {
    return <Navigate to="/shopkeeper" replace />;
  }
  if (role === "user") return <Navigate to="/user" replace />;

  return <Navigate to="/login" replace />;
};

/* ============================
   APP ROUTER
============================ */

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/select-store" element={<SelectStore />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <RoleHomeRedirect />
            </RequireAuth>
          }
        />

        <Route
          path="/superadmin/*"
          element={
            <RequireAuth>
              <RequireRole allowed={["superadmin"]}>
                <AdminLayout />
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="stores" replace />} />
          <Route path="stores" element={<Stores />} />
          <Route path="create-admin" element={<CreateStoreAdmin />} />
        </Route>

        <Route
          path="/admin/*"
          element={
            <RequireAuth>
              <RequireRole allowed={["admin"]}>
                <RequireStoreSelected>
                  <AdminLayout />
                </RequireStoreSelected>
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="store-settings" element={<StoreSettings />} />
          <Route path="categories" element={<Categories />} />
          <Route path="products" element={<Products />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="roles" element={<Role />} />
          <Route path="permissions" element={<Permissions />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="contacts" element={<ContactMessages />} />
        </Route>

        <Route
          path="/shopkeeper/*"
          element={
            <RequireAuth>
              <RequireRole allowed={["shopkeeper", "ca"]}>
                <RequireStoreSelected>
                  <AdminLayout />
                </RequireStoreSelected>
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="categories" element={<Categories />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="contacts" element={<ContactMessages />} />
        </Route>

        <Route
          path="/user"
          element={
            <RequireAuth>
              <RequireRole allowed={["user"]}>
                <RequireStoreSelected>
                  <Home />
                </RequireStoreSelected>
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/category/:categoryName"
          element={
            <RequireAuth>
              <RequireRole allowed={["user"]}>
                <RequireStoreSelected>
                  <CategoryProducts />
                </RequireStoreSelected>
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/product/:id"
          element={
            <RequireAuth>
              <RequireRole allowed={["user"]}>
                <RequireStoreSelected>
                  <ProductDetails />
                </RequireStoreSelected>
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/cart"
          element={
            <RequireAuth>
              <RequireRole allowed={["user"]}>
                <RequireStoreSelected>
                  <CartPage />
                </RequireStoreSelected>
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <RequireRole allowed={["user"]}>
                <RequireStoreSelected>
                  <CheckoutPage />
                </RequireStoreSelected>
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/my-orders"
          element={
            <RequireAuth>
              <RequireRole allowed={["user"]}>
                <RequireStoreSelected>
                  <MyOrdersPage />
                </RequireStoreSelected>
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/search"
          element={
            <RequireAuth>
              <RequireRole allowed={["user"]}>
                <RequireStoreSelected>
                  <Search />
                </RequireStoreSelected>
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/contact"
          element={
            <RequireAuth>
              <RequireRole allowed={["user"]}>
                <RequireStoreSelected>
                  <Contact />
                </RequireStoreSelected>
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Footer/>
    </BrowserRouter>
  );
}