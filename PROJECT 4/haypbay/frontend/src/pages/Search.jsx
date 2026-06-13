import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import "./search.css";

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const Search = () => {
  const query = useQuery();
  const keyword = query.get("q");
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getStoreId = () => {
    try {
      const store = JSON.parse(localStorage.getItem("activeStore") || "null");
      return store?._id;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const fetchSearch = async () => {
      try {
        const storeId = getStoreId();
        if (!storeId) return;

        const { data } = await axios.get(
          `/api/products/home/${storeId}/search?q=${keyword}`
        );

        setProducts(data);
      } catch (error) {
        console.error("Search Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (keyword) fetchSearch();
  }, [keyword]);

  if (loading) return <p className="search-loading">Searching...</p>;

  return (
    <div className="search-page">
      <h2 className="search-title">Search Results for "{keyword}"</h2>

      {products.length === 0 ? (
        <p className="search-empty">No products found</p>
      ) : (
        <div className="search-grid">
          {products.map((p) => (
            <div key={p._id} className="search-card">
              
              {/* IMAGE */}
              <div className="search-img">
                <img
                  src={`http://localhost:4000/uploads/${p.images?.[0]}`}
                  alt={p.name}
                />
              </div>

              {/* INFO */}
              <div className="search-info">
                <h3>{p.name}</h3>
                <p className="price">₹{p.price}</p>

                <div className="product-buttons">
                  <button
                    className="view-btn"
                    onClick={() => navigate(`/product/${p._id}`)}
                  >
                    View More
                  </button>

                  <button className="cart-btn">
                    Add to Cart
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;