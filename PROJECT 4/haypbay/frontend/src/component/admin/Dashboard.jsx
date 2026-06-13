import React from "react";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="admin-content">
      <h1>Dashboard</h1>
      <p>Welcome {user?.name || "User"}</p>
    </div>
  );
};

export default Dashboard;
