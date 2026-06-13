import { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import api from "../../api/axios";
import { useStore } from "../../context/StoreContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "./userPage.css";

const UsersPage = () => {
  const { activeStore } = useStore();
  const activeStoreId = activeStore?._id || "";

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");

  const [staffPage, setStaffPage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);
  const rowsPerPage = 10;

  const safeJSON = (key) => {
    try {
      const val = localStorage.getItem(key);
      if (!val) return null;
      return JSON.parse(val);
    } catch {
      return null;
    }
  };

  const currentUser = safeJSON("user");

  const roleNameById = useMemo(() => {
    const m = new Map();
    roles.forEach((r) => {
      if (r?._id && r?.name) m.set(String(r._id), r.name);
    });
    return m;
  }, [roles]);

  const getRoleText = (role) => {
    if (!role) return "";

    if (typeof role === "string") {
      return roleNameById.get(role) || role;
    }

    if (typeof role === "object") {
      if (role.name) return role.name;
      if (role._id) return roleNameById.get(String(role._id)) || "";
    }

    if (Array.isArray(role)) {
      return getRoleText(role[0]);
    }

    return "";
  };

  const getRoleId = (role) => {
    if (!role) return "";

    if (typeof role === "string") return role;

    if (typeof role === "object" && role._id) {
      return String(role._id);
    }

    if (Array.isArray(role)) {
      return getRoleId(role[0]);
    }

    return "";
  };

  const userRole = useMemo(() => {
    const roleText = getRoleText(currentUser?.role) || currentUser?.roleName || "";
    return String(roleText).toLowerCase();
    // eslint-disable-next-line
  }, [currentUser, roles]);

  if (!currentUser) {
    return (
      <p style={{ color: "orange" }}>
        Session expired / user data missing. Please login again.
      </p>
    );
  }

  const isAdminLike = ["admin", "superadmin"].includes(userRole);
  const canViewUsers = isAdminLike || ["shopkeeper", "ca"].includes(userRole);

  if (!canViewUsers) {
    return (
      <p style={{ color: "orange" }}>
        Unauthorized: Only admin/superadmin/shopkeeper/ca can view users
      </p>
    );
  }

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      if (isAdminLike && !activeStoreId) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const res = await api.get("/api/admin/users");
      const list = Array.isArray(res.data) ? res.data : res.data?.users || [];
      setUsers(list);
      setStaffPage(1);
      setCustomerPage(1);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to fetch users"
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      if (isAdminLike && !activeStoreId) {
        setRoles([]);
        return;
      }

      const res = await api.get("/api/roles");
      setRoles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("Roles fetch error:", err);
      setRoles([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    // eslint-disable-next-line
  }, [activeStoreId]);

  const startEdit = (u) => {
    setEditingUser(u);
    setEditName(u.name || "");
    setEditRole(getRoleId(u.role));
    setShowModal(true);
  };

  const handleUpdateUser = async () => {
    try {
      if (!editingUser?._id) return;

      const payload = {
        name: editName,
        roleId: editRole,
        role: editRole,
      };

      const res = await api.put(`/api/admin/users/${editingUser._id}`, payload);
      const updated = res.data?.user || res.data;

      setShowModal(false);
      setEditingUser(null);

      if (updated?._id) {
        setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
      } else {
        fetchUsers();
      }

      alert("User updated ✅");
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Update failed"
      );
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      if (!window.confirm("Delete this user?")) return;

      await api.delete(`/api/admin/users/${id}`);

      setUsers((prev) => prev.filter((u) => u._id !== id));
      alert("User deleted 🗑️");
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Delete failed"
      );
    }
  };

  const staffUsers = useMemo(() => {
    return users.filter((u) => {
      const roleText = String(getRoleText(u.role) || "").toLowerCase();
      return ["admin", "shopkeeper", "ca"].includes(roleText);
    });
    // eslint-disable-next-line
  }, [users, roles]);

  const customerUsers = useMemo(() => {
    return users.filter((u) => {
      const roleText = String(getRoleText(u.role) || "").toLowerCase();
      return roleText === "user";
    });
    // eslint-disable-next-line
  }, [users, roles]);

  const getBadgeClass = (roleText) => {
    const r = String(roleText || "").toLowerCase();

    if (r === "admin") return "badge bg-danger";
    if (r === "shopkeeper") return "badge bg-primary";
    if (r === "ca") return "badge bg-dark";
    return "badge bg-success";
  };

  const staffColumns = useMemo(() => {
    const cols = [
      {
        name: "#",
        selector: (_, index) => (staffPage - 1) * rowsPerPage + index + 1,
        width: "70px",
      },
      {
        name: "Name",
        selector: (row) => row.name || "",
        sortable: true,
        grow: 1.2,
      },
      {
        name: "Email",
        selector: (row) => row.email || "",
        sortable: true,
        grow: 1.6,
      },
      {
        name: "Role",
        selector: (row) => getRoleText(row.role),
        sortable: true,
        width: "140px",
        cell: (row) => {
          const roleText = getRoleText(row.role) || "";
          return <span className={getBadgeClass(roleText)}>{roleText}</span>;
        },
      },
      {
        name: "Verified",
        selector: (row) => (row.isVerified ? "Yes" : "No"),
        sortable: true,
        width: "120px",
        center: true,
        cell: (row) => (
          <span className={row.isVerified ? "badge bg-success" : "badge bg-secondary"}>
            {row.isVerified ? "Yes" : "No"}
          </span>
        ),
      },
    ];

    if (isAdminLike) {
      cols.push({
        name: "Actions",
        button: true,
        center: true,
        width: "200px",
        cell: (row) => (
          <div className="user-actions">
            <button className="btn btn-sm btn-warning" onClick={() => startEdit(row)}>
              Update
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(row._id)}>
              Delete
            </button>
          </div>
        ),
      });
    }

    return cols;
    // eslint-disable-next-line
  }, [roles, userRole, staffPage]);

  const customerColumns = useMemo(() => {
    return [
      {
        name: "#",
        selector: (_, index) => (customerPage - 1) * rowsPerPage + index + 1,
        width: "70px",
      },
      {
        name: "Name",
        selector: (row) => row.name || "",
        sortable: true,
        grow: 1.2,
      },
      {
        name: "Email",
        selector: (row) => row.email || "",
        sortable: true,
        grow: 1.6,
      },
      {
        name: "Role",
        selector: (row) => getRoleText(row.role),
        sortable: true,
        width: "140px",
        cell: (row) => {
          const roleText = getRoleText(row.role) || "user";
          return <span className={getBadgeClass(roleText)}>{roleText}</span>;
        },
      },
      {
        name: "Verified",
        selector: (row) => (row.isVerified ? "Yes" : "No"),
        sortable: true,
        width: "120px",
        center: true,
        cell: (row) => (
          <span className={row.isVerified ? "badge bg-success" : "badge bg-secondary"}>
            {row.isVerified ? "Yes" : "No"}
          </span>
        ),
      },
    ];
    // eslint-disable-next-line
  }, [roles, customerPage]);

  return (
    <div className="user-page">
      <h2 className="user-title">Users Management</h2>

      <div style={{ marginBottom: 10, fontSize: 14 }}>
        Store: <b>{activeStore?.name || activeStoreId || "Not selected"}</b>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="user-table-card mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="m-0">Staff / Managed Users</h4>
          <span className="badge bg-info">{staffUsers.length}</span>
        </div>

        <DataTable
          columns={staffColumns}
          data={staffUsers}
          progressPending={loading}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10]}
          onChangePage={(page) => setStaffPage(page)}
          highlightOnHover
          striped
          responsive
          noDataComponent="No staff users found"
        />
      </div>

      <div className="user-table-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="m-0">Customers</h4>
          <span className="badge bg-success">{customerUsers.length}</span>
        </div>

        <DataTable
          columns={customerColumns}
          data={customerUsers}
          progressPending={loading}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10]}
          onChangePage={(page) => setCustomerPage(page)}
          highlightOnHover
          striped
          responsive
          noDataComponent="No customers found"
        />
      </div>

      {showModal && (
        <div className="user-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="m-0">Update User</h5>
              <button className="btn btn-light btn-sm" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <div className="mb-3">
              <label className="form-label">Name</label>
              <input
                className="form-control"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
              >
                {roles
                  .filter((r) => String(r.name || "").toLowerCase() !== "user")
                  .map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleUpdateUser}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;