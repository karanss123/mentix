import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import "./Products.css";

const API_BASE_URL = "https://mentix-cg1j.onrender.com";
const FALLBACK_MAIN = "https://picsum.photos/700";
const FALLBACK_CARD = "https://picsum.photos/400";
const FALLBACK_THUMB = "https://picsum.photos/200";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSize, setSelectedSize] = useState("M");
  const [showDescription, setShowDescription] = useState(true);
  const [showShipping, setShowShipping] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");

  const sizes = ["S", "M", "L", "XL", "XXL"];

  useEffect(() => {
    const fetchRelatedProducts = async (productData, storeId) => {
      try {
        setRelatedLoading(true);

        const categoryName = productData?.category?.name || "";

        if (!categoryName || !storeId) {
          setRelatedProducts([]);
          return;
        }

        const res = await axios.get(
          `${API_BASE_URL}/api/products/home/${storeId}/category/${encodeURIComponent(
            categoryName
          )}`
        );

        const allRelated = Array.isArray(res.data) ? res.data : [];

        const filtered = allRelated
          .filter((item) => String(item._id) !== String(productData._id))
          .slice(0, 4);

        setRelatedProducts(filtered);
      } catch (err) {
        console.error("Related products fetch error:", err);
        setRelatedProducts([]);
      } finally {
        setRelatedLoading(false);
      }
    };

    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const activeStore = JSON.parse(
          localStorage.getItem("activeStore") || "null"
        );
        const storeId = activeStore?._id;

        if (!storeId) {
          setError("Store ID not found");
          setLoading(false);
          return;
        }

        const res = await axios.get(
          `${API_BASE_URL}/api/products/public/${id}`
        );

        const productData = res.data?.product || res.data;

        if (!productData || !productData._id) {
          setError("Product not found");
          setProduct(null);
          return;
        }

        setProduct(productData);

        if (productData.images?.length > 0) {
          setSelectedImage(`${API_BASE_URL}/uploads/${productData.images[0]}`);
        } else {
          setSelectedImage(FALLBACK_MAIN);
        }

        await fetchRelatedProducts(productData, storeId);
      } catch (err) {
        console.error("Product detail fetch error:", err);
        setError(
          err?.response?.data?.msg ||
            err?.response?.data?.message ||
            "Product details fetch failed"
        );
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductDetails();
    } else {
      setError("Invalid product id");
      setLoading(false);
    }
  }, [id]);

  const getMainImage = (item) => {
    if (item?.images?.[0]) {
      return `${API_BASE_URL}/uploads/${item.images[0]}`;
    }
    return FALLBACK_CARD;
  };

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      _id: `${product._id}-${selectedSize}`,
      productId: product._id,
      name: product.name || "Product",
      image: getMainImage(product),
      price: Number(product.price) || 0,
      size: selectedSize,
    });

    alert("Added to cart");
  };

  const handleRelatedAddToCart = (item) => {
    const defaultSize = "M";

    addToCart({
      _id: `${item._id}-${defaultSize}`,
      productId: item._id,
      name: item.name || "Product",
      image: getMainImage(item),
      price: Number(item.price) || 0,
      size: defaultSize,
    });

    alert("Added to cart");
  };

  const imageList =
    product?.images?.length > 0
      ? product.images.map((img) => `${API_BASE_URL}/uploads/${img}`)
      : [FALLBACK_MAIN, "https://picsum.photos/701", "https://picsum.photos/702"];

  if (loading) {
    return <h2 style={{ textAlign: "center", marginTop: "40px" }}>Loading...</h2>;
  }

  if (error) {
    return (
      <h2 style={{ textAlign: "center", marginTop: "40px", color: "red" }}>
        {error}
      </h2>
    );
  }

  return (
    <div className="pd-page">
      <div className="pd-breadcrumb">
        <Link to="/user">Home</Link>
        <span>•</span>
        <span>Product details</span>
      </div>

      <div className="pd-wrapper">
        <div className="pd-left">
          <div className="pd-main-image">
            <img
              src={selectedImage}
              alt={product?.name || "Product"}
              onError={(e) => {
                e.target.src = FALLBACK_MAIN;
              }}
            />
          </div>

          <div className="pd-thumbs">
            {imageList.map((img, index) => (
              <div
                key={index}
                className={`pd-thumb ${selectedImage === img ? "active" : ""}`}
                onClick={() => setSelectedImage(img)}
              >
                <img
                  src={img}
                  alt={`thumb-${index}`}
                  onError={(e) => {
                    e.target.src = FALLBACK_THUMB;
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pd-right">
          <div className="pd-badge">{product?.category?.name || "Fashion"}</div>

          <h1 className="pd-title">{product?.name}</h1>
          <h2 className="pd-price">₹{product?.price}</h2>

          <div className="pd-delivery-box">
            Order in <strong>02:30:25</strong> to get next day delivery
          </div>

          <div className="pd-size-section">
            <h4>Select Size</h4>
            <div className="pd-sizes">
              {sizes.map((size) => (
                <button
                  key={size}
                  className={selectedSize === size ? "size-btn active" : "size-btn"}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="pd-cart-row">
            <button className="pd-cart-btn" onClick={handleAddToCart}>
              Add to Cart
            </button>
            <button className="pd-wishlist-btn">♡</button>
          </div>

          <div className="pd-accordion">
            <div
              className="pd-accordion-header"
              onClick={() => setShowDescription(!showDescription)}
            >
              <h3>Description & Fit</h3>
              <span>{showDescription ? "⌃" : "⌄"}</span>
            </div>

            {showDescription && (
              <div className="pd-accordion-body">
                <p>
                  {product?.description ||
                    "Comfortable premium fabric with a relaxed fit, soft inner finish, full sleeves, and everyday wear styling. Perfect for casual and streetwear looks."}
                </p>
              </div>
            )}
          </div>

          <div className="pd-accordion">
            <div
              className="pd-accordion-header"
              onClick={() => setShowShipping(!showShipping)}
            >
              <h3>Shipping</h3>
              <span>{showShipping ? "⌃" : "⌄"}</span>
            </div>

            {showShipping && (
              <div className="pd-shipping-grid">
                <div className="pd-ship-box">
                  <span className="pd-ship-icon">%</span>
                  <div>
                    <small>Discount</small>
                    <p>Disc 50%</p>
                  </div>
                </div>

                <div className="pd-ship-box">
                  <span className="pd-ship-icon">📦</span>
                  <div>
                    <small>Package</small>
                    <p>Regular Package</p>
                  </div>
                </div>

                <div className="pd-ship-box">
                  <span className="pd-ship-icon">📅</span>
                  <div>
                    <small>Delivery Time</small>
                    <p>3-4 Working Days</p>
                  </div>
                </div>

                <div className="pd-ship-box">
                  <span className="pd-ship-icon">🚚</span>
                  <div>
                    <small>Estimated Arrival</small>
                    <p>10 - 12 October 2024</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="related-section">
        <div className="related-header">
          <h2>Related Products</h2>
          <p>You may also like these items</p>
        </div>

        {relatedLoading ? (
          <h3 className="related-loading">Loading related products...</h3>
        ) : relatedProducts.length === 0 ? (
          <p className="related-empty">No related products found</p>
        ) : (
          <div className="related-grid">
            {relatedProducts.map((item) => (
              <div key={item._id} className="related-card">
                <div
                  className="related-img"
                  onClick={() => navigate(`/product/${item._id}`)}
                >
                  <img
                    src={
                      item.images?.[0]
                        ? `${API_BASE_URL}/uploads/${item.images[0]}`
                        : FALLBACK_CARD
                    }
                    alt={item.name || "Product"}
                    onError={(e) => {
                      e.target.src = FALLBACK_CARD;
                    }}
                  />
                </div>

                <div className="related-info">
                  <h3 onClick={() => navigate(`/product/${item._id}`)}>
                    {item.name}
                  </h3>
                  <p className="related-price">₹{item.price}</p>

                  <div className="related-btns">
                    <button
                      className="related-view-btn"
                      onClick={() => navigate(`/product/${item._id}`)}
                    >
                      View More
                    </button>

                    <button
                      className="related-cart-btn"
                      onClick={() => handleRelatedAddToCart(item)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;