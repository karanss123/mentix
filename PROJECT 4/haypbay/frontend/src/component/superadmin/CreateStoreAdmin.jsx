import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useStore } from "../../context/StoreContext";
import { Link } from "react-router-dom";

const CreateStoreAdmin = () => {
  const { activeStore } = useStore();

  const [form, setForm] = useState({
    storeId: "",
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeStore?._id) {
      setForm((p) => ({ ...p, storeId: activeStore._id }));
    }
  }, [activeStore?._id]);

  const submit = async () => {
    if (!form.storeId || !form.name || !form.email || !form.password) {
      return alert("All fields required");
    }

    setLoading(true);
    try {
      const res = await api.post("/api/superadmin/create-store-admin", {
        storeId: form.storeId,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      alert(res?.data?.message || "Admin created");
      setForm((p) => ({ ...p, name: "", email: "", password: "" }));
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>SuperAdmin • Create Store Admin</h2>

      <div style={{ marginBottom: 12 }}>
        <Link to="/superadmin/stores">← Back to Stores</Link>
      </div>

      <div style={{ marginBottom: 10 }}>
        <b>Store ID:</b>{" "}
        {form.storeId ? <code>{form.storeId}</code> : <span>Not selected</span>}
      </div>

      {!form.storeId && (
        <div style={{ marginBottom: 12, color: "crimson" }}>
          Please select a store first from <Link to="/superadmin/stores">Stores</Link>.
        </div>
      )}

      <div style={{ display: "grid", gap: 10, maxWidth: 420 }}>
        <input
          type="text"
          placeholder="Admin name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={{ padding: 8 }}
        />
        <input
          type="email"
          placeholder="Admin email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={{ padding: 8 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          style={{ padding: 8 }}
        />

        <button onClick={submit} disabled={loading || !form.storeId}>
          {loading ? "Creating..." : "Create Admin"}
        </button>
      </div>
    </div>
  );
};

export default CreateStoreAdmin;