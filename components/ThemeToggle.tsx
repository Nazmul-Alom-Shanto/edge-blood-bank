"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("b24bb-theme") as "dark" | "light" | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored === "light" ? "light" : "");
    }
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("b24bb-theme", next);
    document.documentElement.setAttribute("data-theme", next === "light" ? "light" : "");
  };

  return (
    <button className="theme-toggle" onClick={toggle} title="Toggle theme">
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
