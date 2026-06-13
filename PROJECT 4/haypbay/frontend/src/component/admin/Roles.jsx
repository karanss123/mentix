import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { useStore } from "../../context/StoreContext";
import "./admin.css";

const Roles = () => {
  const { activeStore } = useStore();
  const activeStoreId = activeStore?._id || "";

  const API = useMemo(() => "/api/roles", []);
  const PERM_API = useMemo(() => "/api/permissions", []);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const userRoleName = useMemo(() => {
    const r = user?.role;
    if (!r) return "";
    if (typeof r === "string") return r.toLowerCase();
    if (typeof r === "object" && r?.name) return String(r.name).toLowerCase();
    return "";
  }, [user]);

  const isAdmin = userRoleName === "admin";

  const [name, setName] = useState("");
  const [roles, setRoles] = useState([]);
  const [editId, setEditId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showTrash, setShowTrash] = useState(false);

  // Assign Permissions Modal State
  const [showPermModal, setShowPermModal] = useState(false);
  const [permLoading, setPermLoading] = useState(false);
  const [permSaving, setPermSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [selectedPermIds, setSelectedPermIds] = useState(new Set());

  const fetchRoles = async () => {
    try {
      setError("");
      setLoading(true);

      if (!activeStoreId) {
        setRoles([]);
        setLoading(false);
        return;
      }

      const url = showTrash ? `${API}/deleted/list` : API;
      const res = await api.get(url);
      setRoles(res.data || []);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.msg ||
        "Roles fetch failed. Backend running?";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin && showTrash) setShowTrash(false);
    // eslint-disable-next-line
  }, [isAdmin]);

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line
  }, [showTrash, activeStoreId]);

  const isDuplicate = (val) => {
    const v = val.trim().toLowerCase();
    return roles.some((r) => r.name?.toLowerCase() === v && r._id !== editId);
  };

  const resetForm = () => {
    setName("");
    setEditId(null);
    setError("");
  };

  const addOrUpdateRole = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!activeStoreId) return setError("Select a store first");

    const clean = name.trim();
    if (!clean) return setError("Role name required");
    if (isDuplicate(clean)) return setError("Role already exists");

    try {
      setError("");
      setSaving(true);

      if (editId) {
        await api.put(`${API}/${editId}`, { name: clean });
      } else {
        await api.post(API, { name: clean });
      }

      resetForm();
      fetchRoles();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.response?.data?.msg || "Role action failed";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (role) => {
    if (!isAdmin) return;
    setEditId(role._id);
    setName(role.name || "");
    setError("");
  };

  const handleSoftDelete = async (id) => {
    if (!isAdmin) return;
    const ok = window.confirm("Are you sure you want to delete this role? (Soft delete)");
    if (!ok) return;

    try {
      setError("");
      setSaving(true);

      await api.delete(`${API}/${id}`);

      if (editId === id) resetForm();
      fetchRoles();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.msg || "Delete failed";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (id) => {
    if (!isAdmin) return;

    try {
      setError("");
      setSaving(true);

      await api.put(`${API}/restore/${id}`, {});
      fetchRoles();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.msg || "Restore failed";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!isAdmin) return;
    const ok = window.confirm("This will permanently delete the role. Continue?");
    if (!ok) return;

    try {
      setError("");
      setSaving(true);

      await api.delete(`${API}/permanent/${id}`);
      fetchRoles();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.response?.data?.msg || "Permanent delete failed";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const openAssignPermissions = async (role) => {
    if (!isAdmin) return;
    if (!activeStoreId) return setError("Select a store first");

    try {
      setError("");
      setPermLoading(true);
      setSelectedRole(role);
      setShowPermModal(true);

      const [permRes, roleRes] = await Promise.all([
        api.get(PERM_API),
        api.get(`${API}/${role._id}`),
      ]);

      const allPerms = permRes.data || [];
      const assigned = roleRes.data?.permissions || [];

      setPermissions(allPerms);

      const ids = assigned.map((p) => (typeof p === "string" ? p : p._id));
      setSelectedPermIds(new Set(ids));
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.msg ||
        "Failed to load permissions";
      setError(msg);
      setShowPermModal(false);
    } finally {
      setPermLoading(false);
    }
  };

  const closeAssignPermissions = () => {
    setShowPermModal(false);
    setSelectedRole(null);
    setPermissions([]);
    setSelectedPermIds(new Set());
  };

  const togglePerm = (permId) => {
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const saveRolePermissions = async () => {
    if (!isAdmin || !selectedRole) return;

    try {
      setPermSaving(true);
      await api.put(`${API}/${selectedRole._id}/permissions`, {
        permissions: Array.from(selectedPermIds),
      });

      closeAssignPermissions();
      fetchRoles();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.msg ||
        "Failed to save permissions";
      setError(msg);
    } finally {
      setPermSaving(false);
    }
  };

  return (
    <div className="roles-page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0 }}>{showTrash ? "Roles (Trash)" : "Roles"}</h2>
          {(loading || saving) && (
            <span style={{ fontSize: 14, opacity: 0.7 }}>{loading ? "Loading..." : "Saving..."}</span>
          )}
        </div>

        {isAdmin && (
          <button
            type="button"
            className="btn grey"
            onClick={() => {
              setShowTrash((p) => !p);
              resetForm();
            }}
            disabled={saving}
          >
            {showTrash ? "Back to Active" : "Trash"}
          </button>
        )}
      </div>

      <div style={{ marginTop: 10, fontSize: 14, opacity: 0.75 }}>
        Store: <b>{activeStore?.name || activeStoreId || "Not selected"}</b>
      </div>

      {error && (
        <div style={{ marginTop: 12, background: "#ffe6e6", border: "1px solid #ffb3b3", padding: "10px 12px", borderRadius: 8, color: "#b30000", fontWeight: 600 }}>
          {error}
        </div>
      )}

      {isAdmin && !showTrash && (
        <form className="role-form" onSubmit={addOrUpdateRole} style={{ marginTop: 16 }}>
          <input
            type="text"
            placeholder={editId ? "Update role name" : "Add role"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />

          <button type="submit" className="btn primary" disabled={saving}>
            {editId ? "Update" : "Add"}
          </button>

          {editId && (
            <button type="button" className="btn grey" onClick={resetForm} disabled={saving}>
              Cancel
            </button>
          )}
        </form>
      )}

      <div className="role-table" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 70 }}>#</th>
              <th>Role Name</th>
              <th style={{ textAlign: "right", width: 420 }}>{isAdmin ? "Actions" : ""}</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" style={{ textAlign: "center", padding: 24 }}>
                  Loading roles...
                </td>
              </tr>
            ) : roles.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: "center", padding: 24 }}>
                  {showTrash ? "No deleted roles found" : "No roles found"}
                </td>
              </tr>
            ) : (
              roles.map((r, i) => (
                <tr key={r._id}>
                  <td>{i + 1}</td>
                  <td style={{ textTransform: "capitalize", fontWeight: 600 }}>{r.name}</td>
                  <td style={{ textAlign: "right" }}>
                    {isAdmin ? (
                      !showTrash ? (
                        <>
                          <button type="button" className="btn primary" onClick={() => openAssignPermissions(r)} disabled={saving}>
                            Assign Permissions
                          </button>
                          <button type="button" className="btn edit" onClick={() => handleEdit(r)} disabled={saving} style={{ marginLeft: 8 }}>
                            Edit
                          </button>
                          <button type="button" className="btn delete" onClick={() => handleSoftDelete(r._id)} disabled={saving} style={{ marginLeft: 8 }}>
                            Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="btn primary" onClick={() => handleRestore(r._id)} disabled={saving}>
                            Restore
                          </button>
                          <button type="button" className="btn delete" onClick={() => handlePermanentDelete(r._id)} disabled={saving} style={{ marginLeft: 8 }}>
                            Permanent Delete
                          </button>
                        </>
                      )
                    ) : (
                      ""
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPermModal && (
        <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.5)" }} onClick={closeAssignPermissions}>
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content" style={{ borderRadius: 12 }}>
              <div className="modal-header">
                <h3 style={{ margin: 0 }}>
                  Assign Permissions —{" "}
                  <span style={{ color: "#2563eb", textTransform: "capitalize" }}>
                    {selectedRole?.name}
                  </span>
                </h3>

                <button className="btn grey" type="button" onClick={closeAssignPermissions}>
                  Close
                </button>
              </div>

              <div className="modal-body" style={{ padding: 16 }}>
                {permLoading ? (
                  <div style={{ padding: 12 }}>Loading permissions...</div>
                ) : permissions.length === 0 ? (
                  <div style={{ padding: 12, opacity: 0.8 }}>No permissions found</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                    {permissions.map((p) => (
                      <label
                        key={p._id}
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "flex-start",
                          padding: 10,
                          border: "1px solid #e5e7eb",
                          borderRadius: 10,
                          cursor: "pointer",
                          background: selectedPermIds.has(p._id) ? "#f0f7ff" : "#fff",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermIds.has(p._id)}
                          onChange={() => togglePerm(p._id)}
                          style={{ marginTop: 3 }}
                        />
                        <div>
                          <div style={{ fontWeight: 700 }}>{p.key}</div>
                          {p.description ? <div style={{ fontSize: 12, opacity: 0.75 }}>{p.description}</div> : null}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: 16 }}>
                <button className="btn grey" type="button" onClick={closeAssignPermissions}>
                  Cancel
                </button>

                <button className="btn primary" type="button" onClick={saveRolePermissions} disabled={permSaving || permLoading}>
                  {permSaving ? "Saving..." : "Save Permissions"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;