import { useEffect, useMemo, useState } from "react";
import { useStore } from "../../context/StoreContext";
import DataTable from "react-data-table-component";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../../api/axios";

const Categories = () => {
  const { activeStore } = useStore();
  const activeStoreId = activeStore?._id || "";

  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ safe user read
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const roleName = useMemo(() => {
    const r = user?.roleName || user?.role?.name || user?.role || "";
    return String(r || "").toLowerCase();
  }, [user]);

  const perms = useMemo(
    () => (user?.permissions || []).map((p) => String(p).toLowerCase()),
    [user]
  );

  // ✅ admin/superadmin bypass (same as backend)
  const isAdmin = roleName === "admin" || roleName === "superadmin";

  const canView = isAdmin || perms.includes("categories:view");
  const canCreate = isAdmin || perms.includes("categories:create");
  const canUpdate = isAdmin || perms.includes("categories:update");
  const canDelete = isAdmin || perms.includes("categories:delete");

  const token = localStorage.getItem("token");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      if (!activeStoreId) {
        setCategories([]);
        setLoading(false);
        return;
      }

      const res = await api.get("/api/categories");
      setCategories(res.data || []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.msg ||
        "Failed to fetch categories";
      setError(msg);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ refetch on store change
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchCategories();
    // eslint-disable-next-line
  }, [token, activeStoreId]);

  const saveCategory = async () => {
    if (!category.trim()) return;

    if (!activeStoreId) return setError("Select a store first");

    if (!editId && !canCreate)
      return setError("No permission: categories:create");

    if (editId && !canUpdate)
      return setError("No permission: categories:update");

    try {
      setError("");

      if (editId) {
        const res = await api.put(`/api/categories/${editId}`, {
          name: category.trim(),
        });

        setCategories((prev) =>
          prev.map((cat) => (cat._id === editId ? res.data : cat))
        );

        setEditId(null);
      } else {
        const res = await api.post("/api/categories", {
          name: category.trim(),
        });

        setCategories((prev) => [res.data, ...prev]);
      }

      setCategory("");
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.response?.data?.msg || "Save failed";
      setError(msg);
    }
  };

  const deleteCategory = async (id) => {
    if (!canDelete) return setError("No permission: categories:delete");
    if (!window.confirm("Delete category?")) return;

    try {
      setError("");
      await api.delete(`/api/categories/${id}`);
      setCategories((prev) => prev.filter((cat) => cat._id !== id));
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.msg ||
        "Delete failed";
      setError(msg);
    }
  };

  const editCategory = (cat) => {
    if (!canUpdate) return setError("No permission: categories:update");
    setCategory(cat.name || "");
    setEditId(cat._id);
  };

  const columns = useMemo(() => {
    const baseCols = [
      {
        name: "#",
        selector: (row, index) => index + 1,
        width: "60px",
      },
      {
        name: "Category Name",
        selector: (row) => row.name,
        sortable: true,
      },
    ];

    // ✅ only show Actions if user can do something
    const showActions = canUpdate || canDelete;

    if (!showActions) return baseCols;

    return [
      ...baseCols,
      {
        name: "Actions",
        width: "200px",
        cell: (row) => (
          <div style={{ display: "inline-flex", gap: "8px" }}>
            {canUpdate && (
              <button
                className="btn btn-warning btn-sm"
                onClick={() => editCategory(row)}
              >
                Edit
              </button>
            )}

            {canDelete && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => deleteCategory(row._id)}
              >
                Delete
              </button>
            )}
          </div>
        ),
      },
    ];
  }, [canUpdate, canDelete]);

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;

  if (!activeStoreId) {
    return (
      <div className="container mt-5">
        <h2>Categories</h2>
        <p style={{ color: "crimson" }}>
          Select a store first.
        </p>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="container mt-5">
        <h2>Categories</h2>
        <p style={{ color: "crimson" }}>
          Access denied: missing <b>categories:view</b>
        </p>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Categories</h2>

      <p style={{ color: "gray", marginTop: "10px" }}>
        Store: <b>{activeStore?.name || activeStoreId}</b>
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      {(canCreate || canUpdate) && (
        <div className="d-flex mb-3">
          <input
            type="text"
            placeholder="Add category"
            className="form-control me-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <button className="btn btn-primary" onClick={saveCategory}>
            {editId ? "Update" : "Add"}
          </button>

          {editId && (
            <button
              className="btn btn-secondary ms-2"
              onClick={() => {
                setCategory("");
                setEditId(null);
                setError("");
              }}
            >
              Cancel
            </button>
          )}
        </div>
      )}

      <DataTable
        columns={columns}
        data={categories}
        pagination
        highlightOnHover
        striped
        dense
      />
    </div>
  );
};

export default Categories;