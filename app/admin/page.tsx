import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/i18n";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value || "de") as Locale;
  const dict = getDictionary(locale).admin;
  
  const userCount = await prisma.user.count();
  const lotCount = await prisma.parkingLot.count();
  const spaceCount = await prisma.parkingSpace.count();

  return (
    <div className="animate-fade-in">
      <h1>{dict.title}</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginTop: "2rem" }}>
        <div className="surface">
          <h3>{dict.users}</h3>
          <p>Total Users Enrolled: {userCount}</p>
          <Link href="/admin/users" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            {dict.users}
          </Link>
        </div>
        <div className="surface">
          <h3>{dict.lots}</h3>
          <p>Total Lots: {lotCount} <br/> Total Spaces: {spaceCount}</p>
          <Link href="/admin/lots" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            {dict.lots}
          </Link>
        </div>
        <div className="surface">
          <h3>{dict.settings}</h3>
          <p>Fairness rules & global configuration</p>
          <Link href="/admin/settings" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            {dict.settings}
          </Link>
        </div>
      </div>
    </div>
  );
}
