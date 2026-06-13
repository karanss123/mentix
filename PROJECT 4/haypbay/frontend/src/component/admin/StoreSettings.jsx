import { useEffect, useState } from "react";
import api from "../../api/axios";

const StoreSettings = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    availability: "",
    facebook: "",
    instagram: "",
    youtube: "",
    pinterest: "",
  });

  const [loading, setLoading] = useState(true);

  /* ================= FETCH STORE ================= */
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get("/api/stores/current");

        const s = res.data;

        setForm({
          name: s.name || "",
          phone: s.contact?.phone || "",
          email: s.contact?.email || "",
          address: s.contact?.address || "",
          availability: s.contact?.availability || "",
          facebook: s.contact?.social?.facebook || "",
          instagram: s.contact?.social?.instagram || "",
          youtube: s.contact?.social?.youtube || "",
          pinterest: s.contact?.social?.pinterest || "",
        });
      } catch (err) {
        console.error("Store fetch error:", err);
        alert("Failed to load store");
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* ================= UPDATE ================= */
  const handleUpdate = async () => {
    try {
      const payload = {
        name: form.name?.trim(),
        phone: form.phone?.trim(),
        email: form.email?.trim(),
        address: form.address?.trim(),
        availability: form.availability?.trim(),
        facebook: form.facebook?.trim(),
        instagram: form.instagram?.trim(),
        youtube: form.youtube?.trim(),
        pinterest: form.pinterest?.trim(),
      };

      const res = await api.put("/api/stores/current", payload);

      alert(res.data.message || "Store updated successfully");
    } catch (err) {
      console.error("UPDATE STORE ERROR:", err.response?.data || err.message);

      alert(
        err.response?.data?.message ||
          "Update failed (check console for details)"
      );
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mt-4">
      <h2>Store Settings</h2>

      {/* BASIC */}
      <label>Store Name</label>
      <input
        className="form-control mb-3"
        name="name"
        value={form.name}
        onChange={handleChange}
      />

      <label>Phone</label>
      <input
        className="form-control mb-3"
        name="phone"
        value={form.phone}
        onChange={handleChange}
      />

      <label>Email</label>
      <input
        className="form-control mb-3"
        name="email"
        value={form.email}
        onChange={handleChange}
      />

      <label>Address</label>
      <input
        className="form-control mb-3"
        name="address"
        value={form.address}
        onChange={handleChange}
      />

      <label>Availability</label>
      <input
        className="form-control mb-3"
        name="availability"
        value={form.availability}
        onChange={handleChange}
      />

      {/* SOCIAL (optional) */}
      <h5 className="mt-4">Social Links (optional)</h5>

      <input
        className="form-control mb-2"
        placeholder="Facebook"
        name="facebook"
        value={form.facebook}
        onChange={handleChange}
      />

      <input
        className="form-control mb-2"
        placeholder="Instagram"
        name="instagram"
        value={form.instagram}
        onChange={handleChange}
      />

      <input
        className="form-control mb-2"
        placeholder="YouTube"
        name="youtube"
        value={form.youtube}
        onChange={handleChange}
      />

      <input
        className="form-control mb-3"
        placeholder="Pinterest"
        name="pinterest"
        value={form.pinterest}
        onChange={handleChange}
      />

      <button className="btn btn-primary" onClick={handleUpdate}>
        Update Store
      </button>
    </div>
  );
};

export default StoreSettings;