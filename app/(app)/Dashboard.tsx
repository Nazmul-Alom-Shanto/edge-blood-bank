"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BLOOD_GROUPS, isEligibleToDonate } from "@/lib/constants";
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

interface Stats {
  total: number;
  eligible: number;
  byGroup: Record<string, number>;
}

interface Props {
  userRole: "admin" | "moderator";
  userName: string;
}

export function Dashboard({ userRole, userName }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, eligible: 0, byGroup: {} });
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);
    const res = await fetch("/api/students");
    const data = await res.json() as { students?: Student[] };
    const list: Student[] = data.students || [];
    setStudents(list);

    // Compute stats
    const byGroup: Record<string, number> = {};
    let eligible = 0;
    for (const s of list) {
      byGroup[s.blood_group] = (byGroup[s.blood_group] || 0) + 1;
      if (isEligibleToDonate(s.last_donated_at)) eligible++;
    }
    setStats({ total: list.length, eligible, byGroup });
    setLoading(false);
  }

  const filteredByGroup = selectedGroup
    ? students.filter((s) => s.blood_group === selectedGroup)
    : students;

  // Show top 5 recent donors (those with last_donated_at)
  const recentDonors = [...students]
    .filter((s) => s.last_donated_at)
    .sort((a, b) => (b.last_donated_at ?? 0) - (a.last_donated_at ?? 0))
    .slice(0, 5);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting()}, {userName.split(" ")[0]} 👋</h1>
          <p className="page-subtitle">Here&apos;s what&apos;s happening in the blood bank</p>
        </div>
        <div className="flex gap-2">
          <Link href="/students/new" className="btn btn-primary">
            ＋ Add Student
          </Link>
          <Link href="/donations/new" className="btn btn-secondary">
            🩸 Log Donation
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-stats mb-6">
        <div className="stat-card">
          <div className="stat-icon red">👥</div>
          <div>
            <div className="stat-value">{loading ? "—" : stats.total}</div>
            <div className="stat-label">Total Students</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div>
            <div className="stat-value">{loading ? "—" : stats.eligible}</div>
            <div className="stat-label">Eligible to Donate</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">⏳</div>
          <div>
            <div className="stat-value">{loading ? "—" : stats.total - stats.eligible}</div>
            <div className="stat-label">In Cooldown (90 days)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">🩸</div>
          <div>
            <div className="stat-value">{loading ? "—" : Object.keys(stats.byGroup).length}</div>
            <div className="stat-label">Blood Groups Present</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem", alignItems: "start" }}>
        {/* Blood group quick filter */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontWeight: 700, fontSize: "1rem" }}>Find Donors by Blood Group</h2>
            {selectedGroup && (
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedGroup(null)}>
                Clear filter
              </button>
            )}
          </div>

          <div className="filter-chips mb-4">
            {BLOOD_GROUPS.map((g) => (
              <button
                key={g}
                className={`chip ${selectedGroup === g ? "active" : ""}`}
                onClick={() => setSelectedGroup(selectedGroup === g ? null : g)}
              >
                {g}
                {stats.byGroup[g] ? ` (${stats.byGroup[g]})` : ""}
              </button>
            ))}
          </div>

          {selectedGroup && (
            <div>
              <p className="text-sm text-muted mb-4">
                Showing <strong style={{ color: "var(--red-400)" }}>{filteredByGroup.length}</strong> students with blood group{" "}
                <strong style={{ color: "var(--red-400)" }}>{selectedGroup}</strong>
              </p>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Batch</th>
                      <th>Room</th>
                      <th>Phone</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredByGroup.map((s) => (
                      <tr key={s.id} onClick={() => window.location.href = `/students/${s.id}`}>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td className="text-muted">{s.batch}</td>
                        <td className="text-muted">{s.room_number || "—"}</td>
                        <td className="text-muted">{s.phone || "—"}</td>
                        <td><EligibilityBadge lastDonatedAt={s.last_donated_at} /></td>
                      </tr>
                    ))}
                    {filteredByGroup.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                          No students with blood group {selectedGroup}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!selectedGroup && (
            <p className="text-sm text-muted">Click a blood group above to see matching donors instantly.</p>
          )}
        </div>

        {/* Recent donors sidebar */}
        <div className="card" style={{ flexShrink: 0 }}>
          <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>Recent Donations</h2>
          {recentDonors.length === 0 ? (
            <p className="text-sm text-muted">No donations logged yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {recentDonors.map((s) => (
                <Link
                  key={s.id}
                  href={`/students/${s.id}`}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "rgba(220,38,38,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "0.75rem", color: "var(--red-400)",
                    flexShrink: 0,
                  }}>
                    {s.blood_group}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {s.last_donated_at
                        ? new Date(s.last_donated_at * 1000).toLocaleDateString()
                        : "Never"}
                    </div>
                  </div>
                  <EligibilityBadge lastDonatedAt={s.last_donated_at} />
                </Link>
              ))}
            </div>
          )}
          <Link href="/students" className="btn btn-ghost btn-sm w-full" style={{ marginTop: "1rem", justifyContent: "center" }}>
            View all students →
          </Link>
        </div>
      </div>

      {userRole === "admin" && (
        <div className="card mt-6" style={{
          background: "linear-gradient(135deg, rgba(220,38,38,0.08), rgba(127,29,29,0.1))",
          borderColor: "rgba(220,38,38,0.2)",
        }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: "1.5rem" }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Admin Panel</div>
              <div className="text-sm text-muted">Manage moderator accounts and system access</div>
            </div>
            <Link href="/admin/users" className="btn btn-secondary btn-sm" style={{ marginLeft: "auto" }}>
              Manage Users
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
