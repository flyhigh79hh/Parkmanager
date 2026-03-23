"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { setLocale } from "@/app/actions";
import { useState } from "react";

export default function Header({ locale, dict }: { locale: string; dict: any }) {
  const pathname = usePathname();
  const [isPending, setIsPending] = useState(false);

  const toggleLocale = async () => {
    setIsPending(true);
    const newLocale = locale === "en" ? "de" : "en";
    await setLocale(newLocale);
    window.location.reload();
  };

  return (
    <header className="header animate-slide-down">
      <div className="container header-content">
        <Link href="/" className="logo">
          Parkmanager
        </Link>
        <nav className="nav-links">
          <Link href="/status" className={`nav-link ${pathname === "/status" ? "active" : ""}`}>
            {dict.status}
          </Link>
          <Link href="/booking" className={`nav-link ${pathname === "/booking" ? "active" : ""}`}>
            {dict.booking}
          </Link>
          <Link href="/admin" prefetch={false} className={`nav-link ${pathname.startsWith("/admin") ? "active" : ""}`}>
            {dict.admin}
          </Link>
          <button onClick={toggleLocale} disabled={isPending} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            {locale.toUpperCase()} 🔄
          </button>
        </nav>
      </div>
    </header>
  );
}
