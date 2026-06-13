import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaClock,
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaPinterestP,
} from "react-icons/fa";
import "./contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
const backendUrl = "http://localhost:4000";
  const [store, setStore] = useState(null);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const getStoreId = () => {
    try {
      const store = JSON.parse(localStorage.getItem("activeStore") || "null");
      if (!store) return "";
      if (store._id) return store._id;
      if (store.storeId) return store.storeId;
      return "";
    } catch {
      return "";
    }
  };

  /* ================= FETCH STORE ================= */
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const token = localStorage.getItem("token");

        const { data } = await axios.get(
          "http://localhost:4000/api/stores/current",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "x-store-id": getStoreId(),
            },
          }
        );

        setStore(data);
      } catch (err) {
        console.error("Store fetch error:", err);
      }
    };

    fetchStore();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (successMsg) setSuccessMsg("");
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSuccessMsg("");
    setErrorMsg("");

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.subject.trim() ||
      !formData.message.trim()
    ) {
      setErrorMsg("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        storeId: getStoreId(),
      };

      const res = await axios.post(
        "http://localhost:4000/api/contact/send",
        payload
      );

      setSuccessMsg(res.data.message || "Message sent successfully");

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  /* ================= SAFE VALUES ================= */
  const contact = store?.contact || {};

  return (
    <section className="contact-page">
      <div className="contact-top">
        <h1>Contact MENTIX</h1>
        <p>
          Have a question about orders, products, sizes, or support? Send us a
          message and our team will get back to you.
        </p>
      </div>

      <div className="contact-container">
        {/* ================= FORM ================= */}
        <div className="contact-form-box">
          <h2>Get in Touch</h2>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="input-row">
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <input
              type="text"
              name="subject"
              placeholder="Enter subject"
              value={formData.subject}
              onChange={handleChange}
              required
            />

            <textarea
              rows="6"
              name="message"
              placeholder="Write your message"
              value={formData.message}
              onChange={handleChange}
              required
            />

            <button type="submit" className="send-btn" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </button>

            {successMsg && <p className="msg success">{successMsg}</p>}
            {errorMsg && <p className="msg error">{errorMsg}</p>}
          </form>
        </div>

        {/* ================= DETAILS ================= */}
        <div className="contact-details-box">
          <h2>Contact Details</h2>
          <p className="details-text">
            We are here to help you with shopping, delivery, returns, and any
            product-related queries.
          </p>

          <div className="details-grid">
            <div className="detail-card">
              <div className="detail-icon">
                <FaMapMarkerAlt />
              </div>
              <div>
                <h4>Address</h4>
                <p>{contact.address || "Not available"}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-icon">
                <FaPhoneAlt />
              </div>
              <div>
                <h4>Phone</h4>
                <p>{contact.phone || "Not available"}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-icon">
                <FaClock />
              </div>
              <div>
                <h4>Availability</h4>
                <p>{contact.availability || "Not available"}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-icon">
                <FaEnvelope />
              </div>
              <div>
                <h4>Email</h4>
                <p>{contact.email || "Not available"}</p>
              </div>
            </div>
          </div>

          <div className="social-section">
            <h4>Follow Us</h4>
            <div className="social-icons">
              <a href={contact?.social?.facebook || "#"}>
                <FaFacebookF />
              </a>
              <a href={contact?.social?.instagram || "#"}>
                <FaInstagram />
              </a>
              <a href={contact?.social?.youtube || "#"}>
                <FaYoutube />
              </a>
              <a href={contact?.social?.pinterest || "#"}>
                <FaPinterestP />
              </a>
            </div>
          </div>
        </div>
      </div>
    {/* ================= PREMIUM ABOUT ================= */}
<section className="about-premium">

  <div className="about-header">
    <h2>Redefining Streetwear Culture</h2>
    <p>
      At MENTIX, we don’t just sell clothes — we build style, confidence,
      and identity for the modern generation.
    </p>
  </div>

  <div className="about-content">

    {/* LEFT */}
    <div className="about-text">
      <h3>Why Choose Us</h3>

      <div className="about-points">
        <div className="point">
          <span>🚀</span>
          <div>
            <h4>Fast Delivery</h4>
            <p>Quick and reliable shipping across India</p>
          </div>
        </div>

        <div className="point">
          <span>💎</span>
          <div>
            <h4>Premium Quality</h4>
            <p>Only handpicked high-quality products</p>
          </div>
        </div>

        <div className="point">
          <span>🔐</span>
          <div>
            <h4>Secure Payments</h4>
            <p>100% safe and trusted transactions</p>
          </div>
        </div>

        <div className="point">
          <span>🎯</span>
          <div>
            <h4>Trendy Collection</h4>
            <p>Stay ahead with latest fashion drops</p>
          </div>
        </div>
      </div>
    </div>

    {/* RIGHT */}
    <div className="about-image">
      <img
        src={`${backendUrl}/uploads/1774248428290-511521166.jpg`}
        alt="Fashion"
      />
    </div>

  </div>

  {/* STATS */}
  <div className="about-stats">
    <div className="stat">
      <h3>10K+</h3>
      <p>Happy Customers</p>
    </div>

    <div className="stat">
      <h3>500+</h3>
      <p>Products</p>
    </div>

    <div className="stat">
      <h3>24/7</h3>
      <p>Support</p>
    </div>

    <div className="stat">
      <h3>99%</h3>
      <p>Satisfaction</p>
    </div>
  </div>

</section>
    </section>
  );
};

export default Contact;