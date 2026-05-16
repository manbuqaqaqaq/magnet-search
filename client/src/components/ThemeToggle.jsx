import { useState, useEffect, useCallback } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) { root.classList.add("dark"); root.classList.remove("light"); }
    else { root.classList.add("light"); root.classList.remove("dark"); }
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const toggle = useCallback(() => setDark((d) => !d), []);

  return (
    <button
      onClick={toggle}
      title={dark ? "切换亮色" : "切换暗色"}
      className="w-8 h-8 flex items-center justify-center rounded-md border border-[#1e2128] light:border-gray-200 bg-[#0b0d12] light:bg-white text-sm hover:border-accent/30 transition-all duration-200 font-mono"
    >
      {dark ? "◑" : "◐"}
    </button>
  );
}
