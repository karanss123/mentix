import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  FaSearch,
  FaShoppingCart,
  FaUser,
  FaUserPlus,
  FaSignOutAlt,
  FaBoxOpen,
} from "react-icons/fa";
import { useCart } from "../context/CartContext";
import "./navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const { cartCount } = useCart();

  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  let activeStore = null;
  try {
    activeStore = JSON.parse(localStorage.getItem("activeStore") || "null");
  } catch {
    activeStore = null;
  }

  const role = user?.roleName || user?.role?.name || user?.role || "";
  const roleLower = String(role).toLowerCase();

  const isUser = !!token && roleLower === "user";
  const isAdmin =
    !!token && (roleLower === "admin" || roleLower === "shopkeeper");
  const isSuperAdmin = !!token && roleLower === "superadmin";

  const logoPath = isUser
    ? "/"
    : isAdmin
    ? "/admin"
    : isSuperAdmin
    ? "/superadmin"
    : "/";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("stores");
    localStorage.removeItem("activeStore");
    localStorage.removeItem("cartItems");
    navigate("/login");
  };

  const handleSearch = () => {
    const q = searchTerm.trim();

    if (!q) {
      navigate("/");
      return;
    }

    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="custom-navbar">
      <div className="nav-top container">
        
        {/* 🔍 Animated Search */}
        {isUser && (
          <div className="nav-search">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="search-input"
            />
            <button onClick={handleSearch} className="search-btn">
              <FaSearch />
            </button>
          </div>
        )}

        {/* LOGO */}
        <div className="nav-logo">
          <Link to={logoPath}>MENTIX</Link>
        </div>

        {/* RIGHT ICONS */}
        <div className="nav-icons">
          
          {isUser && (
            <>
              {/* 📦 My Orders Icon */}
              <Link to="/my-orders" className="icon-btn">
                <FaBoxOpen size={20} title="My Orders" />
              </Link>

              {/* 🛒 Cart */}
              <Link to="/cart" className="icon-btn cart-icon">
                <FaShoppingCart size={20} />

                {Number(cartCount) > 0 && (
                  <span className="cart-count">
                    {cartCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {!token && (
            <>
              <button className="icon-btn" onClick={() => navigate("/login")}>
                <FaUser />
              </button>

              <button
                className="icon-btn"
                onClick={() => navigate("/register")}
              >
                <FaUserPlus />
              </button>
            </>
          )}

          {isAdmin && (
            <button className="icon-btn" onClick={() => navigate("/admin")}>
              <FaUser />
            </button>
          )}

          {isSuperAdmin && (
            <button
              className="icon-btn"
              onClick={() => navigate("/superadmin")}
            >
              <FaUser />
            </button>
          )}

          {/* 🚪 Logout Icon */}
          {token && (
            <button className="icon-btn" onClick={logout}>
              <FaSignOutAlt size={20} title="Logout" />
            </button>
          )}
        </div>
      </div>

      {/* CATEGORY MENU */}
      {isUser && (
        <div className="nav-menu">
          <ul>
            <li><Link to="/category/watch">WATCH</Link></li>
            <li><Link to="/category/tshirts">T-SHIRTS</Link></li>
            <li><Link to="/category/jeans">JEANS</Link></li>
            <li><Link to="/category/new">NEW</Link></li>
            <li><Link to="/category/shirts">SHIRTS</Link></li>
            <li><Link to="/category/shoes">SHOES</Link></li>
            
            <li><Link to="/contact">CONTACT</Link></li>
            <li><Link to="/contact">karan</Link></li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Navbar;