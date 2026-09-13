"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DonationLog {
  id: string;
  donated_at: number;
  note: string | null;
  created_at: number;
  student_name: string;
  blood_group: string;
  batch: string;
  logged_by_name: string;
}

export default function DonationHistoryPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<DonationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/donations");
      const data = await res.json() as { logs?: DonationLog[] };
      setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Donation History</h1>
          <p className="page-subtitle">A global record of all blood donations</p>
        </div>
        <Link href="/donations/new" className="btn btn-primary">＋ Record Donation</Link>
      </div>

      {/* Table */}
      <div className="table-container" style={{ marginTop: "1rem" }}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Donor</th>
              <th>Blood Group</th>
              <th>Batch</th>
              <th>Logged By</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                  <span className="spinner" />
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📜</div>
                    <div className="empty-state-title">No donations recorded yet</div>
                    <p style={{ fontSize: "0.82rem" }}>When a student donates, it will appear here.</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 600 }}>{new Date(log.donated_at * 1000).toLocaleDateString()}</td>
                  <td>{log.student_name}</td>
                  <td><span className="blood-badge">{log.blood_group}</span></td>
                  <td className="text-muted">{log.batch}</td>
                  <td className="text-muted">{log.logged_by_name}</td>
                  <td className="text-muted" style={{ fontSize: "0.8rem" }}>{log.note || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
