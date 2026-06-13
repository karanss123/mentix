import { useEffect, useState } from "react";
import api from "../../api/axios";

const Profile = () => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/users/profile"); // ✅ interceptor adds headers
        setName(res.data.name);
      } catch (error) {
        console.error("Failed to fetch profile:", error.response?.data || error.message);
        alert("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const updateProfile = async () => {
    if (!name.trim()) return alert("Name cannot be empty");

    try {
      await api.put("/api/users/profile", { name }); // ✅ interceptor adds headers

      const updatedUser = { ...user, name };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      alert("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error.response?.data || error.message);
      alert("Failed to update profile");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mt-4">
      <h2>Profile</h2>

      <label className="mb-1">Name</label>
      <input
        type="text"
        className="form-control mb-3"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={role === "shopkeeper"}
      />

      {role === "admin" && (
        <button className="btn btn-primary" onClick={updateProfile}>
          Update Profile
        </button>
      )}

      {role === "shopkeeper" && (
        <p style={{ color: "gray", marginTop: "10px" }}>You have read-only access</p>
      )}
    </div>
  );
};

export default Profile;