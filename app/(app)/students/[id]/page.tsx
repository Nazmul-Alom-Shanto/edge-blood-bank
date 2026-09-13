"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { BLOOD_GROUPS, getBatchOptions } from "@/lib/constants";
import { EligibilityBadge } from "@/components/EligibilityBadge";

interface Student {
  id: string;
  name: string;
  blood_group: string;
  batch: string;
  phone: string | null;
  room_number: string | null;
  last_donated_at: number | null;
  created_at: number;
}

interface Log {
  id: string;
  donated_at: number;
  note: string | null;
  logged_by_name: string;
  created_at: number;
}

export default function StudentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const batches = getBatchOptions();

  const [student, setStudent] = useState<Student | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Student>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState<string>("moderator");

  useEffect(() => {
    fetchData();
    fetch("/api/auth/me").then((r) => r.json()).then((d: unknown) => setUserRole((d as { role?: string }).role || "moderator"));
  }, [id]);

  async function fetchData() {
    setLoading(true);
    const [sRes, lRes] = await Promise.all([
      fetch(`/api/students/${id}`),
      fetch(`/api/students/${id}/logs`),
    ]);
    const sData = await sRes.json() as { student?: Student };
    const lData = await lRes.json() as { logs?: Log[] };
    if (sRes.ok) {
      setStudent(sData.student ?? null);
      setEditForm(sData.student ?? {});
    }
    setLogs(lData.logs || []);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/students/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json() as { student?: Student; error?: string };
    if (res.ok) {
      setStudent(data.student ?? null);
      setEditing(false);
    } else {
      setError(data.error || "Failed to save");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Remove ${student?.name} from the blood bank? This can be undone by an admin.`)) return;
    const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/students");
  }

  async function handleDeleteLog(logId: string) {
    if (!confirm("Delete this donation log?")) return;
    const res = await fetch(`/api/donations/${logId}`, { method: "DELETE" });
    if (res.ok) fetchData();
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <span className="spinner" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❓</div>
        <div className="empty-state-title">Student not found</div>
        <Link href="/students" className="btn btn-secondary" style={{ marginTop: "1rem" }}>Back to Students</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <Link href="/students" className="back-link">← Back to Students</Link>

      {/* Header Card */}
      <div className="card mb-4" style={{
        background: "linear-gradient(135deg, var(--bg-card), rgba(220,38,38,0.04))",
        borderColor: "rgba(220,38,38,0.15)",
      }}>
        <div className="flex items-center justify-between" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "rgba(220,38,38,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: "1rem", color: "var(--red-400)",
              border: "1px solid rgba(220,38,38,0.2)",
            }}>
              {student.blood_group}
            </div>
            <div>
              <h1 style={{ fontSize: "1.3rem", fontWeight: 700 }}>{student.name}</h1>
              <div className="flex gap-2 items-center" style={{ marginTop: "0.3rem" }}>
                <span className="text-muted text-sm">{student.batch}</span>
                {student.room_number && <span className="text-muted text-sm">· Room {student.room_number}</span>}
                {student.phone && <span className="text-muted text-sm">· {student.phone}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <EligibilityBadge lastDonatedAt={student.last_donated_at} />
            <Link href={`/donations/new?student=${id}`} className="btn btn-primary btn-sm">
              🩸 Log Donation
            </Link>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(!editing)}>
              ✏️ Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
              🗑️
            </button>
          </div>
        </div>

        {student.last_donated_at && (
          <div style={{ marginTop: "1rem", padding: "0.75rem", background: "var(--bg-base)", borderRadius: 8, fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Last donated: <strong style={{ color: "var(--text-primary)" }}>
              {new Date(student.last_donated_at * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </strong>
          </div>
        )}
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="card mb-4">
          <h2 style={{ fontWeight: 700, marginBottom: "1rem" }}>Edit Student</h2>
          {error && <div className="alert alert-error mb-4">{error}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={editForm.name || ""} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select className="form-input" value={editForm.blood_group || ""} onChange={(e) => setEditForm(p => ({ ...p, blood_group: e.target.value }))}>
                  {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Batch</label>
                <select className="form-input" value={editForm.batch || ""} onChange={(e) => setEditForm(p => ({ ...p, batch: e.target.value }))}>
                  {batches.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Room Number</label>
                <input className="form-input" value={editForm.room_number || ""} onChange={(e) => setEditForm(p => ({ ...p, room_number: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" type="tel" value={editForm.phone || ""} onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" /> : "Save Changes"}
              </button>
              <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Donation Timeline */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontWeight: 700 }}>Donation History ({logs.length})</h2>
          <Link href={`/donations/new?student=${id}`} className="btn btn-secondary btn-sm">＋ Log Donation</Link>
        </div>

        {logs.length === 0 ? (
          <div className="empty-state" style={{ padding: "2rem 1rem" }}>
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No donations logged yet</div>
          </div>
        ) : (
          <div className="timeline">
            {logs.map((log) => (
              <div key={log.id} className="timeline-item">
                <div className="timeline-dot">🩸</div>
                <div className="timeline-content">
                  <div className="flex items-center justify-between">
                    <div className="timeline-date">
                      {new Date(log.donated_at * 1000).toLocaleDateString("en-GB", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </div>
                    {userRole === "admin" && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteLog(log.id)}
                        style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <div className="timeline-meta">
                    Logged by {log.logged_by_name}
                    {log.note && <> · {log.note}</>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
