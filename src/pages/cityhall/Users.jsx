import { useState, useEffect } from "react";
import "./User.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://trustpermit-backend.onrender.com/api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users`);

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

  return (
    <div className="users-page">
      <h2>Registered Users</h2>

      {loading ? (
        <p>Loading users...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
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
            {users.length === 0 ? (
              <tr>
                <td colSpan="6">No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id}>
                  <td>{user.fullName || user.name || "No name"}</td>
                  <td>{user.email}</td>
                  <td>{user.role || "citizen"}</td>
                  <td>{user.emailVerified ? "Yes" : "No"}</td>
                  <td>{user.status || "Active"}</td>
                  <td>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleString()
                      : "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}