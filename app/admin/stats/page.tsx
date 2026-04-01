import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function StatsPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value || "de") as Locale;
  const dict = getDictionary(locale).admin;

  const now = new Date();
  
  // This month limits
  const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDayMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  // This week limits
  const day = now.getDay() || 7; // Sunday=7
  const firstDayWeek = new Date(now);
  firstDayWeek.setDate(now.getDate() - day + 1);
  const mondayStr = firstDayWeek.toISOString().split('T')[0];

  const lastDayWeek = new Date(firstDayWeek);
  lastDayWeek.setDate(firstDayWeek.getDate() + 6);
  const sundayStr = lastDayWeek.toISOString().split('T')[0];

  // Users lookup
  const users = await prisma.user.findMany();
  const userMap = new Map(users.map(u => [u.id, u.name]));

  // Active bookings (Month)
  const monthlyBookings = await prisma.booking.findMany({
    where: { date: { gte: firstDayMonth, lte: lastDayMonth } }
  });

  // Action logs for Cancellations (Month)
  const firstDayMonthDate = new Date(`${firstDayMonth}T00:00:00Z`);
  const lastDayMonthDate = new Date(`${lastDayMonth}T23:59:59Z`);
  const monthlyCancellations = await prisma.actionLog.findMany({
    where: { 
      action: 'CANCEL',
      timestamp: { gte: firstDayMonthDate, lte: lastDayMonthDate }
    }
  });

  interface UserStats {
    name: string;
    weekActive: number;
    monthActive: number;
    weekCanceled: number;
    monthCanceled: number;
  }

  const statsMap = new Map<string, UserStats>();

  const getStats = (userId: string) => {
    if (!statsMap.has(userId)) {
      statsMap.set(userId, {
        name: userMap.get(userId) || userId,
        weekActive: 0,
        monthActive: 0,
        weekCanceled: 0,
        monthCanceled: 0
      });
    }
    return statsMap.get(userId)!;
  };

  // Process bookings
  for (const b of monthlyBookings) {
    const st = getStats(b.userId);
    st.monthActive++;
    if (b.date >= mondayStr && b.date <= sundayStr) {
      st.weekActive++;
    }
  }

  // Process cancellations
  for (const c of monthlyCancellations) {
    const st = getStats(c.userId);
    st.monthCanceled++;
    // Check if cancellation timestamp is in current week
    const cancelDateStr = new Date(c.timestamp).toISOString().split('T')[0];
    if (cancelDateStr >= mondayStr && cancelDateStr <= sundayStr) {
      st.weekCanceled++;
    }
  }

  const results = Array.from(statsMap.values()).sort((a, b) => b.monthActive - a.monthActive);

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>{dict.stats}</h1>
        <Link href="/admin" className="btn" style={{ background: "transparent", color: "white", border: "1px solid white" }}>
          {dict.backToAdmin}
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div className="surface" style={{ padding: "1rem" }}>
          <h4>{dict.currentMonth}</h4>
          <p style={{ opacity: 0.7 }}>{firstDayMonth} to {lastDayMonth}</p>
        </div>
        <div className="surface" style={{ padding: "1rem" }}>
          <h4>{dict.currentWeek}</h4>
          <p style={{ opacity: 0.7 }}>{mondayStr} to {sundayStr}</p>
        </div>
      </div>

      <div className="surface" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <th style={{ padding: "1rem" }}>{dict.user}</th>
              <th style={{ padding: "1rem" }}>{dict.activeWeek}</th>
              <th style={{ padding: "1rem" }}>{dict.activeMonth}</th>
              <th style={{ padding: "1rem", opacity: 0.5 }}>{dict.canceledWeek}</th>
              <th style={{ padding: "1rem", opacity: 0.5 }}>{dict.canceledMonth}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((stat, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <td style={{ padding: "1rem", fontWeight: 600 }}>{stat.name}</td>
                <td style={{ padding: "1rem", color: "var(--color-primary)" }}>{stat.weekActive}</td>
                <td style={{ padding: "1rem", color: "var(--color-primary)" }}>{stat.monthActive}</td>
                <td style={{ padding: "1rem", opacity: 0.5 }}>{stat.weekCanceled}</td>
                <td style={{ padding: "1rem", opacity: 0.5 }}>{stat.monthCanceled}</td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "2rem", textAlign: "center", fontStyle: "italic", opacity: 0.5 }}>
                  No statistics available for the current period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
