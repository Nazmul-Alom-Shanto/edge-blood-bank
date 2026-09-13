"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BLOOD_GROUPS, getBatchOptions } from "@/lib/constants";

export default function NewStudentPage() {
  const router = useRouter();
  const batches = getBatchOptions();

  const [form, setForm] = useState({
    name: "",
    blood_group: "",
    batch: "",
    phone: "",
    room_number: "",
    last_donated_at: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string; student?: { id: string } };
      if (!res.ok) {
        setError(data.error || "Failed to add student");
      } else {
        router.push(`/students/${data.student?.id}`);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <Link href="/students" className="back-link">← Back to Students</Link>

      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title">Add Student</h1>
          <p className="page-subtitle">Register a new student in the blood bank</p>
        </div>
      </div>

      <div className="card">
        {error && <div className="alert alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-input"
              placeholder="e.g. Tanvir Ahmed"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="blood_group">Blood Group *</label>
              <select
                id="blood_group"
                name="blood_group"
                className="form-input"
                value={form.blood_group}
                onChange={handleChange}
                required
              >
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="batch">Batch *</label>
              <select
                id="batch"
                name="batch"
                className="form-input"
                value={form.batch}
                onChange={handleChange}
                required
              >
                <option value="">Select batch</option>
                {batches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="room_number">Room Number</label>
              <input
                id="room_number"
                name="room_number"
                type="text"
                className="form-input"
                placeholder="e.g. 214"
                value={form.room_number}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-input"
                placeholder="e.g. 01XXXXXXXXX"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="last_donated_at">Last Donated At (optional)</label>
            <input
              id="last_donated_at"
              name="last_donated_at"
              type="date"
              className="form-input"
              value={form.last_donated_at || ""}
              max={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0]}
              onChange={handleChange}
            />
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              If they have donated before joining the system, record the date here.
            </p>
          </div>

          <div className="flex gap-3" style={{ marginTop: "0.5rem" }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : "Add Student"}
            </button>
            <Link href="/students" className="btn btn-ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
