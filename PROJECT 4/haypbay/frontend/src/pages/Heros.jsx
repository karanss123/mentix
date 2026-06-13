import React, { useEffect, useState } from "react";
import axios from "axios";
import "../pages/styles.css";

const FeaturedSection = () => {
  const [bannerImage, setBannerImage] = useState("");
  const [bannerTitle, setBannerTitle] = useState("Featured Collection");
  const [bannerText, setBannerText] = useState("Explore the latest style");

  useEffect(() => {
    const fetchRandomProductImage = async () => {
      try {
        const activeStore = JSON.parse(localStorage.getItem("activeStore") || "null");
        const storeId = activeStore?._id;

        if (!storeId) return;

        const res = await axios.get(`https://mentix-cg1j.onrender.com/api/products/home/${storeId}`);
        const products = Array.isArray(res.data) ? res.data : [];

        const productsWithImages = products.filter(
          (item) => item.images && item.images.length > 0
        );

        if (productsWithImages.length === 0) return;

        const randomProduct =
          productsWithImages[Math.floor(Math.random() * productsWithImages.length)];

        setBannerImage(`https://mentix-cg1j.onrender.com/uploads/${randomProduct.images[0]}`);
        setBannerTitle(randomProduct.name || "Featured Collection");
        setBannerText(
          randomProduct.description || "Discover premium fashion and streetwear"
        );
      } catch (error) {
        console.error("Featured banner fetch error:", error);
      }
    };

    fetchRandomProductImage();
  }, []);

  return (
    <section
      className="featured-section"
      style={{
        backgroundImage: bannerImage
          ? `url(${bannerImage})`
          : `url("https://picsum.photos/1400/500")`,
      }}
    >
      <div className="featured-overlay">
        <div className="featured-content">
          <p className="featured-subtitle">HYPEBAY x FEATURED</p>
          <h2 className="featured-title">{bannerTitle}</h2>
          <p className="featured-text">{bannerText}</p>
          <button className="featured-btn">EXPLORE THE FIT</button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;