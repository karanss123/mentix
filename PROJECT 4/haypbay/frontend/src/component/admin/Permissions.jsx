import { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import api from "../../api/axios";
import { useStore } from "../../context/StoreContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Permissions.css";

const PERM_API = "/api/permissions";

const Permissions = () => {
  const { activeStore } = useStore();
  const activeStoreId = activeStore?._id || "";

  // ✅ get user + role safely (same style as Roles)
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const userRoleName = useMemo(() => {
    const r = user?.roleName || user?.role?.name || user?.role || "";
    return String(r || "").toLowerCase();
  }, [user]);

  // ✅ admin OR superadmin can manage permissions
  const canManage = userRoleName === "admin" || userRoleName === "superadmin";

  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editDescription, setEditDescription] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // =========================
  // FETCH PERMISSIONS (Store-wise)
  // =========================
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError("");

      if (!activeStoreId) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      const res = await api.get(PERM_API);
      setPermissions(res.data || []);
      setCurrentPage(1);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load permissions"
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Refetch when store changes
  useEffect(() => {
    fetchPermissions();
    // eslint-disable-next-line
  }, [activeStoreId]);

  // =========================
  // ADD
  // =========================
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!canManage) return;

    if (!activeStoreId) return setError("Select a store first");

    if (!key.trim() || !description.trim()) {
      return setError("Key and Description required");
    }

    try {
      setError("");
      await api.post(PERM_API, {
        key: key.trim(),
        description: description.trim(),
      });

      setKey("");
      setDescription("");
      fetchPermissions();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to add permission"
      );
    }
  };

  // =========================
  // UPDATE
  // =========================
  const openEdit = (perm) => {
    if (!canManage) return;
    setEditing(perm);
    setEditDescription(perm.description || "");
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!canManage) return;
    if (!editing?._id) return;

    try {
      setError("");
      await api.put(`${PERM_API}/${editing._id}`, {
        description: editDescription.trim(),
      });

      setShowModal(false);
      setEditing(null);
      fetchPermissions();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to update permission"
      );
    }
  };

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (id) => {
    if (!canManage) return;
    if (!window.confirm("Delete this permission?")) return;

    try {
      setError("");
      await api.delete(`${PERM_API}/${id}`);
      fetchPermissions();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to delete permission"
      );
    }
  };

  // =========================
  // TABLE COLUMNS
  // =========================
  const columns = useMemo(() => {
    const baseCols = [
      {
        name: "#",
        selector: (_, index) => (currentPage - 1) * rowsPerPage + index + 1,
        width: "70px",
      },
      {
        name: "Key",
        selector: (row) => row.key,
        sortable: true,
        grow: 1.5,
        cell: (row) => <span className="perm-pill">{row.key}</span>,
      },
      {
        name: "Description",
        selector: (row) => row.description,
        sortable: true,
        grow: 2,
      },
      {
        name: "Active",
        selector: (row) => (row.isActive ? "Yes" : "No"),
        center: true,
        width: "120px",
        cell: (row) => (
          <span
            className={`badge ${row.isActive ? "bg-success" : "bg-secondary"}`}
          >
            {row.isActive ? "Yes" : "No"}
          </span>
        ),
      },
    ];

    // ✅ Only admin/superadmin can see actions
    if (!canManage) return baseCols;

    return [
      ...baseCols,
      {
        name: "Actions",
        button: true,
        width: "200px",
        center: true,
        cell: (row) => (
          <div className="perm-actions">
            <button
              className="btn btn-warning btn-sm"
              onClick={() => openEdit(row)}
            >
              Update
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => handleDelete(row._id)}
            >
              Delete
            </button>
          </div>
        ),
      },
    ];
  }, [currentPage, canManage]);

  return (
    <div className="perm-page">
      <h2 className="perm-title">Permissions</h2>

      <div style={{ marginBottom: 10, fontSize: 14 }}>
        Store: <b>{activeStore?.name || activeStoreId || "Not selected"}</b>
      </div>

      {!canManage && (
        <div style={{ marginBottom: 10, fontSize: 14, opacity: 0.75 }}>
          You have <b>view-only</b> access.
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {/* ✅ Add Permission only for admin/superadmin */}
      {canManage && (
        <div className="perm-card">
          <h5 className="mb-3">Add Permission</h5>

          <form className="row g-3" onSubmit={handleAdd}>
            <div className="col-md-5">
              <label className="form-label">Key</label>
              <input
                className="form-control"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g. products:create"
              />
            </div>

            <div className="col-md-5">
              <label className="form-label">Description</label>
              <input
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Create product"
              />
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-primary w-100">Add</button>
            </div>
          </form>
        </div>
      )}

      <div className="perm-table-card">
        <DataTable
          columns={columns}
          data={permissions}
          progressPending={loading}
          pagination
          paginationPerPage={5}
          paginationRowsPerPageOptions={[10]}
          onChangePage={(page) => setCurrentPage(page)}
          highlightOnHover
          striped
          responsive
        />
      </div>

      {/* ✅ Modal only for admin/superadmin */}
      {showModal && canManage && (
        <div className="perm-modal-backdrop">
          <div className="perm-modal">
            <h5 className="mb-3">Update Permission</h5>

            <div className="mb-3">
              <label className="form-label">Key</label>
              <input className="form-control" value={editing?.key || ""} disabled />
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <input
                className="form-control"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-success" onClick={handleUpdate}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Permissions;