"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "moderator";
  created_at: number;
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "moderator" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    // Get current user id
    fetch("/api/auth/me").then(r => r.json()).then((d: unknown) => setCurrentUserId((d as { userId?: string }).userId ?? null));
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch("/api/users");
    const data = await res.json() as { users?: User[] };
    setUsers(data.users || []);
    setLoading(false);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json() as { error?: string };
    if (res.ok) {
      setSuccess("User created successfully!");
      setShowModal(false);
      setForm({ name: "", email: "", password: "", role: "moderator" });
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(data.error || "Failed to create user");
    }
    setSaving(false);
  }

  async function handleRoleChange(userId: string, newRole: "admin" | "moderator") {
    if (!confirm(`Change role to ${newRole}?`)) return;
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    fetchUsers();
  }

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`Remove ${name} from the system? They will no longer be able to log in.`)) return;
    await fetch(`/api/users/${userId}`, { method: "DELETE" });
    fetchUsers();
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!resetUserId || resetPassword.length < 8) return;
    
    setResetting(true);
    setError("");
    const res = await fetch(`/api/users/${resetUserId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword }),
    });
    
    if (res.ok) {
      setSuccess("Password reset successfully!");
      setResetUserId(null);
      setResetPassword("");
      setTimeout(() => setSuccess(""), 3000);
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error || "Failed to reset password");
    }
    setResetting(false);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">Admins and moderators who can access this system</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setError(""); setShowModal(true); }}>
          ＋ Add User
        </button>
      </div>

      {success && <div className="alert alert-success mb-4">{success}</div>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}><span className="spinner" /></td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>
                  {u.name}
                  {u.id === currentUserId && (
                    <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", color: "var(--text-muted)" }}>(you)</span>
                  )}
                </td>
                <td className="text-muted">{u.email}</td>
                <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                <td className="text-muted" style={{ fontSize: "0.8rem" }}>
                  {new Date(u.created_at * 1000).toLocaleDateString()}
                </td>
                <td>
                  {u.id !== currentUserId && (
                    <div className="flex gap-2">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setError("");
                          setResetUserId(u.id);
                          setResetPassword("");
                        }}
                      >
                        Reset Password
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRoleChange(u.id, u.role === "admin" ? "moderator" : "admin")}
                      >
                        {u.role === "admin" ? "Demote" : "Promote"}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(u.id, u.name)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2 className="modal-title">Add New User</h2>
            {error && <div className="alert alert-error mb-4">{error}</div>}

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="Name" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" placeholder="email@example.com" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" placeholder="Strong password" value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))} required minLength={8} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3" style={{ marginTop: "0.5rem" }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : "Create User"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetUserId && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setResetUserId(null)}>
          <div className="modal">
            <h2 className="modal-title">Reset Password</h2>
            <p className="page-subtitle" style={{ marginBottom: "1rem" }}>
              Manually set a new password for {users.find(u => u.id === resetUserId)?.name}.
            </p>
            {error && <div className="alert alert-error mb-4">{error}</div>}

            <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">New Password *</label>
                <input 
                  className="form-input" 
                  type="text" 
                  placeholder="New password (min 8 chars)" 
                  value={resetPassword} 
                  onChange={(e) => setResetPassword(e.target.value)} 
                  required 
                  minLength={8} 
                />
              </div>
              <div className="flex gap-3" style={{ marginTop: "0.5rem" }}>
                <button type="submit" className="btn btn-primary" disabled={resetting}>
                  {resetting ? <span className="spinner" /> : "Save Password"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setResetUserId(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
