import { useState, useEffect } from "react";
import CenteredModal from "../../components/CenteredModal";
import "./User.css";

const getApiBaseUrl = () => {
  const configuredUrl = (process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || "")
    .replace(/\/+$/, "");

  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:5000";
  }

  return configuredUrl || "https://trustpermit-backend.onrender.com";
};

const API_BASE_URL = getApiBaseUrl();

export default function Users() {
  const isAdmin = localStorage.getItem("role") === "admin";
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userPendingDelete, setUserPendingDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const registeredUsers = users.filter(
    (user) => String(user.role || "citizen").trim().toLowerCase() === "citizen"
  );

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/users`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users. Please check backend connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (!userId || deletingUser) return;
    setDeletingUser(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete user");
      }

      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
      setError("");
      setUserPendingDelete(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Unable to delete the user right now.");
      setUserPendingDelete(null);
    } finally {
      setDeletingUser(false);
    }
  };

  return (
    <div className="users-page">
      <h2>Registered Users</h2>

      {loading ? (
        <p>Loading users...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Email Verified</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>

            <tbody>
              {registeredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6">No users found.</td>
                </tr>
              ) : (
                registeredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>{user.fullName || user.name || "No name"}</td>
                    <td>{user.email}</td>
                    <td>{user.role || "citizen"}</td>
                    <td>{user.isVerified ? "Yes" : "No"}</td>
                    <td>{user.status || "Active"}</td>
                    <td className="users-created-cell">
                      <span>{user.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A"}</span>
                      {isAdmin && (
                        <button
                          type="button"
                          className="users-delete-button"
                          onClick={() => setUserPendingDelete(user)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <CenteredModal
        open={Boolean(userPendingDelete)}
        title="Delete user?"
        message={`Are you sure you want to delete ${userPendingDelete?.fullName || userPendingDelete?.email || "this user"}? This action cannot be undone.`}
        buttonText={deletingUser ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="error"
        className="users-delete-confirmation"
        onConfirm={() => handleDeleteUser(userPendingDelete?._id)}
        onCancel={() => {
          if (!deletingUser) setUserPendingDelete(null);
        }}
      />
    </div>
  );
}