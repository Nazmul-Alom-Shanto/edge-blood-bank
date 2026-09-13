"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

interface User {
  name: string;
  role: "admin" | "moderator";
}

interface Props {
  user: User;
}

const NAV_ITEMS = [
  { href: "/", icon: "🏠", label: "Dashboard" },
  { href: "/students", icon: "👥", label: "Students" },
  { href: "/donations", icon: "📜", label: "Donation History" },
  { href: "/donations/new", icon: "🩸", label: "Add Donation" },
];

const ADMIN_ITEMS = [
  { href: "/admin/users", icon: "🛡️", label: "Manage Users" },
];

export function Sidebar({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🩸</div>
          <div>
            <div className="sidebar-logo-text">B24 Blood Bank</div>
            <div className="sidebar-logo-sub">Bijoy 24 Hall</div>
          </div>
        </div>

        <div className="nav-section">Main</div>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${isActive(item.href) ? "active" : ""}`}
          >
            <span className="nav-link-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {user.role === "admin" && (
          <>
            <div className="nav-section" style={{ marginTop: "0.5rem" }}>Admin</div>
            {ADMIN_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive(item.href) ? "active" : ""}`}
              >
                <span className="nav-link-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </>
        )}

        <div className="sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", marginBottom: "0.5rem" }}>
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>{user.name}</div>
              <span className={`role-badge ${user.role}`}>{user.role}</span>
            </div>
            <ThemeToggle />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <Link href="/settings" className={`nav-link ${isActive("/settings") ? "active" : ""}`} style={{ color: "var(--text-secondary)" }}>
              <span className="nav-link-icon">⚙️</span>
              Settings
            </Link>
            <button className="nav-link" onClick={handleLogout} style={{ color: "var(--text-muted)" }}>
              <span className="nav-link-icon">🚪</span>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-item ${isActive(item.href) ? "active" : ""}`}
          >
            <span className="mobile-nav-item-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        {user.role === "admin" && (
          <Link
            href="/admin/users"
            className={`mobile-nav-item ${isActive("/admin") ? "active" : ""}`}
          >
            <span className="mobile-nav-item-icon">🛡️</span>
            Users
          </Link>
        )}
      </nav>
    </>
  );
}
