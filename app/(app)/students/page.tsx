"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BLOOD_GROUPS, getBatchOptions, isEligibleToDonate } from "@/lib/constants";
import { EligibilityBadge } from "@/components/EligibilityBadge";

interface Student {
  id: string;
  name: string;
  blood_group: string;
  batch: string;
  phone: string | null;
  room_number: string | null;
  last_donated_at: number | null;
}

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [batch, setBatch] = useState("");
  const batches = getBatchOptions();

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (bloodGroup) params.set("blood_group", bloodGroup);
    if (batch) params.set("batch", batch);
    if (search) params.set("search", search);

    const res = await fetch(`/api/students?${params}`);
    const data = await res.json() as { students?: Student[] };
    setStudents(data.students || []);
    setLoading(false);
  }, [bloodGroup, batch, search]);

  useEffect(() => {
    const t = setTimeout(fetchStudents, 300);
    return () => clearTimeout(t);
  }, [fetchStudents]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{students.length} registered{bloodGroup || batch || search ? " (filtered)" : ""}</p>
        </div>
        <Link href="/students/new" className="btn btn-primary">＋ Add Student</Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0.75rem", alignItems: "end" }}>
          <div className="search-bar form-group">
            <label className="form-label">Search</label>
            <div style={{ position: "relative" }}>
              <span className="search-icon">🔍</span>
              <input
                id="student-search"
                type="text"
                className="form-input"
                placeholder="Name, phone, room..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Blood Group</label>
            <select className="form-input" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
              <option value="">All groups</option>
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Batch</label>
            <select className="form-input" value={batch} onChange={(e) => setBatch(e.target.value)}>
              <option value="">All batches</option>
              {batches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        {/* Blood group chips */}
        <div className="filter-chips mt-4">
          <button className={`chip ${!bloodGroup ? "active" : ""}`} onClick={() => setBloodGroup("")}>All</button>
          {BLOOD_GROUPS.map((g) => (
            <button
              key={g}
              className={`chip ${bloodGroup === g ? "active" : ""}`}
              onClick={() => setBloodGroup(bloodGroup === g ? "" : g)}
            >{g}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Blood Group</th>
              <th>Batch</th>
              <th>Room</th>
              <th>Phone</th>
              <th>Last Donated</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>
                  <span className="spinner" />
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🩸</div>
                    <div className="empty-state-title">No students found</div>
                    <p style={{ fontSize: "0.82rem" }}>Try adjusting your filters or add a new student.</p>
                  </div>
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} onClick={() => router.push(`/students/${s.id}`)}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td><span className="blood-badge">{s.blood_group}</span></td>
                  <td className="text-muted">{s.batch}</td>
                  <td className="text-muted">{s.room_number || "—"}</td>
                  <td className="text-muted">{s.phone || "—"}</td>
                  <td className="text-muted" style={{ fontSize: "0.8rem" }}>
                    {s.last_donated_at
                      ? new Date(s.last_donated_at * 1000).toLocaleDateString()
                      : <span style={{ color: "var(--green-400)" }}>Never (eligible)</span>}
                  </td>
                  <td><EligibilityBadge lastDonatedAt={s.last_donated_at} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
