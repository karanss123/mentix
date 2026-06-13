import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useStore } from "../../context/StoreContext";
import { Link } from "react-router-dom";

const Stores = () => {
  const { stores, setStores, activeStore, setActiveStore } =
    useStore();

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

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

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/stores");
      const list = res?.data?.stores || res?.data || [];
      setStores(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to load stores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
    // eslint-disable-next-line
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const createStore = async () => {
    const clean = form.name.trim();
    if (!clean) return alert("Store name required");

    setCreating(true);
    try {
      const payload = {
        name: clean,
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        availability: form.availability.trim(),
        facebook: form.facebook.trim(),
        instagram: form.instagram.trim(),
        youtube: form.youtube.trim(),
        pinterest: form.pinterest.trim(),
      };

      const res = await api.post("/api/stores", payload);
      const store = res?.data?.store;

      setForm({
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

      await fetchStores();

      if (store?._id) setActiveStore(store);

      alert("Store created");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to create store");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (storeId, storeName) => {
    const ok = window.confirm(
      `Are you sure you want to delete "${storeName}"?`
    );
    if (!ok) return;

    try {
      await api.delete(`/api/stores/${storeId}`);

      await fetchStores();
      alert("Store deleted successfully");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to delete store");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>SuperAdmin • Stores</h2>

      {/* ✅ FIXED: Clear button removed */}
      <div style={{ marginBottom: 12 }}>
        <b>Active Store:</b>{" "}
        {activeStore?._id ? (
          <>
            {activeStore?.name ? `${activeStore.name} ` : ""}
            <code>{activeStore._id}</code>{" "}
            <Link to="/superadmin/create-admin" style={{ marginLeft: 12 }}>
              Create Store Admin →
            </Link>
          </>
        ) : (
          <span>None selected</span>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
            gap: 8,
            maxWidth: 900,
          }}
        >
          <input
            type="text"
            name="name"
            placeholder="New store name"
            value={form.name}
            onChange={handleChange}
            style={{ padding: 8 }}
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            style={{ padding: 8 }}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            style={{ padding: 8 }}
          />

          <input
            type="text"
            name="availability"
            placeholder="Availability"
            value={form.availability}
            onChange={handleChange}
            style={{ padding: 8 }}
          />

          <input
            type="text"
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
            style={{ padding: 8, gridColumn: "1 / -1" }}
          />

          <input
            type="text"
            name="facebook"
            placeholder="Facebook"
            value={form.facebook}
            onChange={handleChange}
            style={{ padding: 8 }}
          />

          <input
            type="text"
            name="instagram"
            placeholder="Instagram"
            value={form.instagram}
            onChange={handleChange}
            style={{ padding: 8 }}
          />

          <input
            type="text"
            name="youtube"
            placeholder="YouTube"
            value={form.youtube}
            onChange={handleChange}
            style={{ padding: 8 }}
          />

          <input
            type="text"
            name="pinterest"
            placeholder="Pinterest"
            value={form.pinterest}
            onChange={handleChange}
            style={{ padding: 8 }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={createStore} disabled={creating}>
            {creating ? "Creating..." : "Create Store"}
          </button>

          <button onClick={fetchStores} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div
        style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}
      >
        <div style={{ padding: 10, background: "#f7f7f7", fontWeight: 600 }}>
          Stores ({stores?.length || 0})
        </div>

        {loading ? (
          <div style={{ padding: 12 }}>Loading...</div>
        ) : stores?.length ? (
          stores.map((s) => {
            const isActive =
              String(activeStore?._id || "") === String(s._id || "");

            return (
              <div
                key={s._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 10,
                  borderTop: "1px solid #eee",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 12 }}>
                    <code>{s._id}</code>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setActiveStore(s)} disabled={isActive}>
                    {isActive ? "Selected" : "Select"}
                  </button>

                  <button
                    onClick={() => handleDelete(s._id, s.name)}
                    style={{
                      background: "red",
                      color: "white",
                      border: "none",
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ padding: 12 }}>No stores found.</div>
        )}
      </div>
    </div>
  );
};

export default Stores;