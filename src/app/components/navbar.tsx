"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "/home.svg" },
  { label: "Analysis", href: "/analysis", icon: "/analysis.svg" },
  { label: "Twin", href: "/twin", icon: "/twin.svg" },
  { label: "Profile", href: "/profile", icon: "/profile.svg" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-5 pt-4 pb-3 z-50">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-col items-center gap-2 transition ${
            pathname === item.href
              ? "text-emerald-600"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Image
            src={item.icon}
            alt={item.label}
            width={20}
            height={20}
            className="w-4.5 h-4.5"
          />
          <span className="text-[10px] font-normal">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}