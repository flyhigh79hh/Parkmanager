import { getDictionary, Locale } from "@/lib/i18n";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function Home() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value || "de") as Locale;
  const dict = getDictionary(locale);

  return (
    <div className="animate-fade-in" style={{ textAlign: "center", paddingTop: "3rem", paddingBottom: "3rem" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "var(--primary-color)", fontWeight: 700, letterSpacing: "-0.05em" }}>{dict.home.title}</h1>
      <p style={{ fontSize: "1.25rem", color: "var(--text-secondary)", marginBottom: "4rem", maxWidth: "600px", margin: "0 auto 4rem" }}>
        {dict.home.subtitle}
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap" }}>
        <Link href="/booking" className="surface" style={{ textDecoration: "none", width: "280px", padding: "3rem 2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1.5rem", textShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>🚗</div>
          <h3 style={{ margin: "0 0 1.5rem 0", color: "var(--text-primary)" }}>{dict.booking.title}</h3>
          <span className="btn btn-primary" style={{ width: "100%" }}>{dict.nav.booking}</span>
        </Link>
        <Link href="/status" className="surface" style={{ textDecoration: "none", width: "280px", padding: "3rem 2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1.5rem", textShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>📊</div>
          <h3 style={{ margin: "0 0 1.5rem 0", color: "var(--text-primary)" }}>{dict.status.title}</h3>
          <span className="btn btn-secondary" style={{ width: "100%", border: "1px solid #e2e8f0" }}>{dict.nav.status}</span>
        </Link>
      </div>
    </div>
  );
}
