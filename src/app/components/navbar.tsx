"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "🏠" },
  { label: "Habits", href: "/habits", icon: "🔁" },
  { label: "Analysis", href: "/analysis", icon: "📊" },
  { label: "Twin", href: "/twin", icon: "🤖" },
  { label: "Profile", href: "/profile", icon: "👤" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-4 z-50">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-col items-center gap-1 text-xs transition ${
            pathname === item.href
              ? "text-emerald-600 font-medium"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}