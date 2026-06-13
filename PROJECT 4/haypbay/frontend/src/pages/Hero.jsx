import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../pages/styles.css";
import api from "../api/axios";

const Hero = () => {
  const navigate = useNavigate();
  const backendUrl = "https://mentix-cg1j.onrender.com";
  const fallbackImg = "https://picsum.photos/300/200";

  const [watchProduct, setwatchProduct] = useState(null);
  const [jeansProduct, setjeansProduct] = useState(null);

  useEffect(() => {
    const fetchPromoProducts = async () => {
      try {
        const activeStore = JSON.parse(localStorage.getItem("activeStore") || "null");
        const storeId = activeStore?._id || activeStore?.id;

        if (!storeId) {
          console.error("Store ID not found in localStorage");
          return;
        }

        const [watchRes, jeansRes] = await Promise.all([
          api.get(`/api/products/home/${storeId}/category/watch`),
          api.get(`/api/products/home/${storeId}/category/jeans`),
        ]);

        const watchData = Array.isArray(watchRes.data?.products)
          ? watchRes.data.products
          : Array.isArray(watchRes.data)
          ? watchRes.data
          : [];

        const jeansData = Array.isArray(jeansRes.data?.products)
          ? jeansRes.data.products
          : Array.isArray(jeansRes.data)
          ? jeansRes.data
          : [];

        setwatchProduct(watchData.length > 0 ? watchData[0] : null);
        setjeansProduct(jeansData.length > 0 ? jeansData[0] : null);
      } catch (error) {
        console.error("Category promo products fetch error:", error);
      }
    };

    fetchPromoProducts();
  }, []);

  const getImageUrl = (product) => {
    if (!product) return fallbackImg;

    const img =
      product.image ||
      product.images?.[0] ||
      product.thumbnail ||
      product.photo ||
      "";

    if (!img) return fallbackImg;

    if (img.startsWith("http")) return img;

    if (img.startsWith("/uploads/")) {
      return `${backendUrl}${img}`;
    }

    return `${backendUrl}/uploads/${img}`;
  };

  const goToProduct = (productId) => {
    if (productId) {
      navigate(`/product/${productId}`);
    }
  };

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1>
            MENTIX <br /> FASHION
          </h1>

          <p>
            Discover a fashion experience that not only mirrors your unique
            personality but embraces all styles. Every piece celebrates
            confidence and individuality.
          </p>

          </div>

        <div className="hero-image">
          <img
            src={`${backendUrl}/uploads/1774246637546-125508799.jpeg`}
            alt="Fashion Models"
            onError={(e) => {
              e.target.src = fallbackImg;
            }}
          />
        </div>
      </section>

      <div className="ticker">
        <div className="ticker-track">
          <span>MENTIX FASHION ✦</span>
          <span>MENTIX FASHION ✦</span>
          <span>MENTIX FASHION ✦</span>
          <span>MENTIX FASHION ✦</span>
          <span>MENTIX FASHION ✦</span>
          <span>MENTIX FASHION ✦</span>
        </div>
      </div>

      <section className="promo-wrap">
        <div className="promo-card promo-light">
          <div className="promo-text">
            <h3>NEW</h3>
            <p>{watchProduct?.name || "New arrival Shoes collection for 2026"}</p>
            <button
              className="promo-btn"
              onClick={() => goToProduct(watchProduct?._id)}
            >
              CHECK →
            </button>
          </div>

          <div className="promo-img">
            <img
              src={getImageUrl(watchProduct)}
              alt={watchProduct?.name || "Shoes"}
              onError={(e) => {
                e.target.src = fallbackImg;
              }}
            />
          </div>
        </div>

        <div className="promo-card promo-dark">
          <div className="promo-text">
            <h3>SALE</h3>
            <p>{jeansProduct?.name || "Exclusive watches upto 40% OFF"}</p>
            <button
              className="promo-btn"
              onClick={() => goToProduct(jeansProduct?._id)}
            >
              CHECK →
            </button>
          </div>

          <div className="promo-img">
            <img
              src={getImageUrl(jeansProduct)}
              alt={jeansProduct?.name || "Watch"}
              onError={(e) => {
                e.target.src = fallbackImg;
              }}
            />
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;