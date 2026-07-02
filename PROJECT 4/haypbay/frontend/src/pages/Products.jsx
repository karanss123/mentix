import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "./Products.css";
import FeaturedSection from "./Heros";

const API_BASE_URL = "https://mentix-cg1j.onrender.com";
const FALLBACK_IMAGE = "https://picsum.photos/400";

const Products = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [newArrivals, setNewArrivals] = useState([]);
  const [watchProducts, setWatchProducts] = useState([]);
  const [shirtProducts, setShirtProducts] = useState([]);
  const [shoesProducts, setShoesProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const activeStore = JSON.parse(
          localStorage.getItem("activeStore") || "null"
        );

        const storeId = activeStore?._id;
        const token = localStorage.getItem("token");

        if (!storeId) {
          console.error("Store ID not found");
          setLoading(false);
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-store-id": storeId,
          },
        };

        const [newRes, watchRes, shirtRes, shoesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/products/home/${storeId}`, config),

          axios.get(
            `${API_BASE_URL}/api/products/home/${storeId}/category/watch`,
            config
          ),

          axios.get(
            `${API_BASE_URL}/api/products/home/${storeId}/category/shirt`,
            config
          ),

          axios.get(
            `${API_BASE_URL}/api/products/home/${storeId}/category/shoes`,
            config
          ),
        ]);

        setNewArrivals(
          Array.isArray(newRes.data)
            ? newRes.data.slice(0, 3)
            : []
        );

        setWatchProducts(
          Array.isArray(watchRes.data)
            ? watchRes.data.slice(0, 3)
            : []
        );

        setShirtProducts(
          Array.isArray(shirtRes.data)
            ? shirtRes.data.slice(0, 3)
            : []
        );

        setShoesProducts(
          Array.isArray(shoesRes.data)
            ? shoesRes.data.slice(0, 3)
            : []
        );
      } catch (error) {
        console.error("Product fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleViewMore = (productId) => {
    navigate(`/product/${productId}`);
  };

  const getImageSrc = (product) => {
    if (product?.images?.length) {
      return `${API_BASE_URL}/uploads/${product.images[0]}`;
    }

    return FALLBACK_IMAGE;
  };

  const handleAddToCart = (product) => {
    addToCart({
      _id: product._id,
      name: product.name || "Product",
      image: getImageSrc(product),
      price: Number(product.price) || 0,
    });

    alert(`${product.name} added to cart`);
  };
    const renderProducts = (items, emptyText) => {
    if (items.length === 0) {
      return <p className="empty-text">{emptyText}</p>;
    }

    return (
      <Swiper
        spaceBetween={25}
        breakpoints={{
          0: {
            slidesPerView: 1.2,
          },
          576: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
        }}
      >
        {items.map((p) => (
          <SwiperSlide key={p._id}>
            <div className="product-card">
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
          </SwiperSlide>
        ))}
      </Swiper>
    );
  };

  if (loading) {
    return <h2 style={{ textAlign: "center" }}>Loading...</h2>;
  }

  return (
    <section className="products">
      <div className="products-section">
        <h2>New Arrivals</h2>
        {renderProducts(newArrivals, "No products found")}
      </div>

      <div className="products-section">
        <h2>Watch</h2>
        {renderProducts(watchProducts, "No watches found")}
      </div>

      <FeaturedSection />

      <div className="products-section">
        <h2>Shirts</h2>
        {renderProducts(shirtProducts, "No shirts found")}
      </div>

      <div className="products-section">
        <h2>Shoes</h2>
        {renderProducts(shoesProducts, "No shoes found")}
      </div>
    </section>
  );
};

export default Products;