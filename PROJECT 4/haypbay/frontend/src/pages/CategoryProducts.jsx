import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import "./Products.css";

const API_BASE_URL = "https://mentix-cg1j.onrender.com";
const FALLBACK_IMAGE = "https://picsum.photos/400";

const CategoryProducts = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const titleMap = {
    immitations: "IMITATION",
    imitation: "IMITATION",

    tshirts: "T-SHIRTS",
    "t-shirts": "T-SHIRTS",
    tshirt: "T-SHIRTS",

    jeans: "JEANS",

    new: "NEW",

    shirts: "SHIRTS",
    shirt: "SHIRTS",

    "one-peice": "ONE PEICE",
    "one piece": "ONE PEICE",
    onepeice: "ONE PEICE",
    "one peice": "ONE PEICE",

    kurtis: "KURTIS",
    kurti: "KURTIS",
  };

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);

        const activeStore = JSON.parse(
          localStorage.getItem("activeStore") || "null"
        );
        const storeId = activeStore?._id;
        const token = localStorage.getItem("token");

        if (!storeId) {
          console.error("Store ID not found");
          setProducts([]);
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-store-id": storeId,
          },
        };

        const currentCategory = (categoryName || "").toLowerCase().trim();

        const categoryMap = {
          imitation: "Immitations",
          immitations: "Immitations",

          tshirt: "Tshirts",
          tshirts: "Tshirts",
          "t-shirts": "Tshirts",

          jeans: "Jeans",

          shirts: "Shirts",
          shirt: "Shirts",

          "one-peice": "One Peice",
          "one piece": "One Peice",
          onepeice: "One Peice",
          "one peice": "One Peice",

          kurti: "Kurtis",
          kurtis: "Kurtis",
        };

        const finalCategory = categoryMap[currentCategory] || categoryName;

        let url = "";

        if (currentCategory === "new") {
          url = `${API_BASE_URL}/api/products/home/${storeId}`;
        } else {
          url = `${API_BASE_URL}/api/products/home/${storeId}/category/${encodeURIComponent(
            finalCategory
          )}`;
        }

        const res = await axios.get(url, config);
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Category product fetch error:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [categoryName]);

  const handleViewMore = (productId) => {
    navigate(`/product/${productId}`);
  };

  const getImageSrc = (product) => {
    if (product?.images?.[0]) {
      const image = product.images[0];
      return image.startsWith("http")
        ? image
        : `${API_BASE_URL}/uploads/${image}`;
    }
    return FALLBACK_IMAGE;
  };

  const handleAddToCart = (product) => {
    const cartProduct = {
      _id: product._id,
      name: product.name || "Product",
      image: getImageSrc(product),
      price: Number(product.price) || 0,
    };

    addToCart(cartProduct);
    alert(`${product.name} added to cart`);
  };

  if (loading) {
    return <h2 style={{ textAlign: "center", padding: "40px" }}>Loading...</h2>;
  }

  return (
    <section className="products">
      <div className="products-section">
        <h2>{titleMap[(categoryName || "").toLowerCase()] || "PRODUCTS"}</h2>

        <div className="products-grid">
          {products.length > 0 ? (
            products.map((p) => (
              <div key={p._id} className="product-card">
                <div className="product-img">
                  <img
                    src={getImageSrc(p)}
                    alt={p.name || "Product"}
                    onError={(e) => {
                      e.target.src = FALLBACK_IMAGE;
                    }}
                  />
                </div>

                <div className="product-info">
                  <h3>{p.name}</h3>
                  <p className="price">₹{p.price}</p>

                  <div className="product-buttons">
                    <button
                      className="view-btn"
                      onClick={() => handleViewMore(p._id)}
                    >
                      View More
                    </button>

                    <button
                      className="cart-btn"
                      onClick={() => handleAddToCart(p)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-text">No products found</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default CategoryProducts;