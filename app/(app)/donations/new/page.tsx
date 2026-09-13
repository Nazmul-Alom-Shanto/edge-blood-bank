"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

interface Student {
  id: string;
  name: string;
  blood_group: string;
  batch: string;
}

function LogDonationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("student") || "";

  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState({
    student_id: preselectedId,
    donated_at: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0],
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/students").then((r) => r.json()).then((d: unknown) => setStudents((d as { students?: Student[] }).students || []));
  }, []);

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.blood_group.includes(search)
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string; log?: unknown };
      if (!res.ok) {
        setError(data.error || "Failed to log donation");
      } else {
        router.push(`/students/${form.student_id}`);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const selectedStudent = students.find((s) => s.id === form.student_id);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <Link href="/" className="back-link">← Back to Dashboard</Link>

      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title">Log Donation</h1>
          <p className="page-subtitle">Record a blood donation event</p>
        </div>
      </div>

      <div className="card">
        {error && <div className="alert alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Student selector */}
          <div className="form-group">
            <label className="form-label">Donor (Student) *</label>
            {selectedStudent ? (
              <div style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.65rem 0.9rem",
                background: "var(--bg-base)",
                border: "1px solid var(--border-mid)",
                borderRadius: 9,
              }}>
                <span className="blood-badge">{selectedStudent.blood_group}</span>
                <span style={{ fontWeight: 600 }}>{selectedStudent.name}</span>
                <span className="text-muted text-sm">{selectedStudent.batch}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ marginLeft: "auto" }}
                  onClick={() => setForm(p => ({ ...p, student_id: "" }))}
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  className="form-input"
                  placeholder="Search student by name or blood group..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ marginBottom: "0.5rem" }}
                />
                <div style={{
                  border: "1px solid var(--border)",
                  borderRadius: 9,
                  overflow: "hidden",
                  maxHeight: 200,
                  overflowY: "auto",
                }}>
                  {filteredStudents.slice(0, 20).map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => { setForm(p => ({ ...p, student_id: s.id })); setSearch(""); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        width: "100%", padding: "0.65rem 1rem",
                        background: "none", border: "none", cursor: "pointer",
                        borderBottom: "1px solid var(--border)",
                        textAlign: "left", color: "var(--text-primary)",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <span className="blood-badge">{s.blood_group}</span>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{s.name}</span>
                      <span className="text-muted text-xs">{s.batch}</span>
                    </button>
                  ))}
                  {filteredStudents.length === 0 && (
                    <p style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>
                      No students found
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="donated_at">Donation Date *</label>
            <input
              id="donated_at"
              type="date"
              className="form-input"
              value={form.donated_at}
              max={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0]}
              onChange={(e) => setForm(p => ({ ...p, donated_at: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="note">Note (optional)</label>
            <input
              id="note"
              type="text"
              className="form-input"
              placeholder="e.g. Donated at CMH, emergency request"
              value={form.note}
              onChange={(e) => setForm(p => ({ ...p, note: e.target.value }))}
            />
          </div>

          <div className="flex gap-3" style={{ marginTop: "0.5rem" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !form.student_id}
            >
              {loading ? <span className="spinner" /> : "🩸 Save Donation"}
            </button>
            <Link href="/" className="btn btn-ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LogDonationPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><span className="spinner" /></div>}>
      <LogDonationForm />
    </Suspense>
  );
}
