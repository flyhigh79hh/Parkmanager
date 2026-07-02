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

  // Active bookings (All-time, includes relations for spaces and lots)
  const allBookings = await prisma.booking.findMany({
    include: { space: { include: { lot: true } } }
  });

  // Filter bookings for current month and week
  const monthlyBookings = allBookings.filter(b => b.date >= firstDayMonth && b.date <= lastDayMonth);
  const weeklyBookings = allBookings.filter(b => b.date >= mondayStr && b.date <= sundayStr);

  // Action logs for Cancellations (Month)
  const firstDayMonthDate = new Date(`${firstDayMonth}T00:00:00Z`);
  const lastDayMonthDate = new Date(`${lastDayMonth}T23:59:59Z`);
  const monthlyCancellations = await prisma.actionLog.findMany({
    where: { 
      action: 'CANCEL',
      timestamp: { gte: firstDayMonthDate, lte: lastDayMonthDate }
    }
  });

  // Retrieve spaces and lots
  const spaces = await prisma.parkingSpace.findMany({
    include: { lot: true }
  });
  const lots = await prisma.parkingLot.findMany({
    include: { spaces: true }
  });

  const totalSpaces = spaces.length;

  // Occupancy rate calculations
  const getDaysBetween = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  let firstBookingDate = "";
  let lastBookingDate = "";
  if (allBookings.length > 0) {
    const sortedDates = allBookings.map(b => b.date).sort();
    firstBookingDate = sortedDates[0];
    lastBookingDate = sortedDates[sortedDates.length - 1];
  }

  const todayStr = now.toISOString().split('T')[0];
  const endRangeStr = lastBookingDate && lastBookingDate > todayStr ? lastBookingDate : todayStr;
  const daysAllTime = firstBookingDate ? getDaysBetween(firstBookingDate, endRangeStr) : 0;
  const daysThisWeek = 7;
  const daysThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const overallOccupancy = totalSpaces > 0 && daysAllTime > 0
    ? Math.round((allBookings.length / (totalSpaces * daysAllTime)) * 100)
    : 0;

  const monthOccupancy = totalSpaces > 0
    ? Math.round((monthlyBookings.length / (totalSpaces * daysThisMonth)) * 100)
    : 0;

  const weekOccupancy = totalSpaces > 0
    ? Math.round((weeklyBookings.length / (totalSpaces * daysThisWeek)) * 100)
    : 0;

  // Fully Booked Days calculation
  const bookingsCountPerDate: Record<string, number> = {};
  for (const b of allBookings) {
    bookingsCountPerDate[b.date] = (bookingsCountPerDate[b.date] || 0) + 1;
  }

  const fullyOccupiedDates: string[] = [];
  if (totalSpaces > 0) {
    for (const [dateStr, count] of Object.entries(bookingsCountPerDate)) {
      if (count === totalSpaces) {
        fullyOccupiedDates.push(dateStr);
      }
    }
  }
  fullyOccupiedDates.sort();

  // Frequencies per Parking Space (Stellplatz)
  const spaceStats = spaces.map(s => {
    const totalCount = allBookings.filter(b => b.spaceId === s.id).length;
    const monthCount = monthlyBookings.filter(b => b.spaceId === s.id).length;
    const weekCount = weeklyBookings.filter(b => b.spaceId === s.id).length;
    return {
      id: s.id,
      name: s.name,
      lotName: s.lot.name,
      totalCount,
      monthCount,
      weekCount
    };
  }).sort((a, b) => b.totalCount - a.totalCount);

  // Frequencies per Parking Lot (Parkplatz)
  const lotStats = lots.map(l => {
    const totalCount = allBookings.filter(b => b.space?.lotId === l.id).length;
    const monthCount = monthlyBookings.filter(b => b.space?.lotId === l.id).length;
    const weekCount = weeklyBookings.filter(b => b.space?.lotId === l.id).length;
    return {
      id: l.id,
      name: l.name,
      spacesCount: l.spaces.length,
      totalCount,
      monthCount,
      weekCount
    };
  }).sort((a, b) => b.totalCount - a.totalCount);

  // User Stats Map
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

  // Process bookings for user statistics
  for (const b of monthlyBookings) {
    const st = getStats(b.userId);
    st.monthActive++;
    if (b.date >= mondayStr && b.date <= sundayStr) {
      st.weekActive++;
    }
  }

  // Process cancellations for user statistics
  for (const c of monthlyCancellations) {
    const st = getStats(c.userId);
    st.monthCanceled++;
    const cancelDateStr = new Date(c.timestamp).toISOString().split('T')[0];
    if (cancelDateStr >= mondayStr && cancelDateStr <= sundayStr) {
      st.weekCanceled++;
    }
  }

  const results = Array.from(statsMap.values()).sort((a, b) => b.monthActive - a.monthActive);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ margin: 0 }}>{dict.stats}</h1>
        <Link href="/admin" className="btn btn-secondary">
          &larr; {dict.backToAdmin}
        </Link>
      </div>

      {/* Warning if no spaces exist */}
      {totalSpaces === 0 && (
        <div className="surface" style={{ background: "#fff5f5", borderColor: "#feb2b2", color: "#c53030", marginBottom: "2rem", fontWeight: 500 }}>
          {dict.noSpacesStats}
        </div>
      )}

      {/* KPI Dashboard Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <div className="surface" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0 }}>
          <div>
            <h4 style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {dict.overallOccupancy}
            </h4>
            <div style={{ fontSize: "2.25rem", fontWeight: 700, color: "var(--primary-color)", margin: "0.5rem 0" }}>
              {overallOccupancy}%
            </div>
          </div>
          <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.7 }}>
            {allBookings.length} {dict.totalBookings} ({dict.daysCount ? dict.daysCount.replace("{count}", String(daysAllTime)) : `${daysAllTime} Tage`})
          </p>
        </div>

        <div className="surface" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0 }}>
          <div>
            <h4 style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {dict.monthOccupancy}
            </h4>
            <div style={{ fontSize: "2.25rem", fontWeight: 700, color: "var(--primary-color)", margin: "0.5rem 0" }}>
              {monthOccupancy}%
            </div>
          </div>
          <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.7 }}>
            {monthlyBookings.length} {dict.totalBookings} ({dict.daysCount ? dict.daysCount.replace("{count}", String(daysThisMonth)) : `${daysThisMonth} Tage`})
          </p>
        </div>

        <div className="surface" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0 }}>
          <div>
            <h4 style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {dict.weekOccupancy}
            </h4>
            <div style={{ fontSize: "2.25rem", fontWeight: 700, color: "var(--primary-color)", margin: "0.5rem 0" }}>
              {weekOccupancy}%
            </div>
          </div>
          <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.7 }}>
            {weeklyBookings.length} {dict.totalBookings} ({dict.daysCount ? dict.daysCount.replace("{count}", "7") : "7 Tage"})
          </p>
        </div>

        <div className="surface" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0 }}>
          <div>
            <h4 style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {dict.fullyOccupiedDays}
            </h4>
            <div style={{ fontSize: "2.25rem", fontWeight: 700, color: "var(--danger-color)", margin: "0.5rem 0" }}>
              {fullyOccupiedDates.length}
            </div>
          </div>
          <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.7 }}>
            {dict.fullyOccupiedDaysDesc}
          </p>
        </div>
      </div>

      {/* List of Fully Occupied Days */}
      {fullyOccupiedDates.length > 0 && (
        <div className="surface" style={{ marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "0.75rem", fontSize: "1.25rem", color: "var(--danger-color)" }}>
            {dict.fullyOccupiedDays} ({fullyOccupiedDates.length})
          </h3>
          <p style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>{dict.fullyOccupiedDaysDesc}:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {fullyOccupiedDates.map(dateStr => {
              const dateObj = new Date(`${dateStr}T00:00:00`);
              const formattedDate = new Intl.DateTimeFormat(locale, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(dateObj);
              return (
                <span key={dateStr} className="badge" style={{ background: "#fee2e2", color: "#991b1b", padding: "0.5rem 0.75rem", fontSize: "0.85rem", border: "1px solid #fca5a5" }}>
                  {formattedDate}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid of Lot and Space Frequencies */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Lot stats */}
        <div className="surface" style={{ display: "flex", flexDirection: "column", margin: 0 }}>
          <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>{dict.statsLots}</h3>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>{dict.lotName}</th>
                  <th style={{ padding: "0.75rem", textAlign: "center" }}>{dict.spaces}</th>
                  <th style={{ padding: "0.75rem", textAlign: "center" }}>{dict.activeWeek}</th>
                  <th style={{ padding: "0.75rem", textAlign: "center" }}>{dict.activeMonth}</th>
                  <th style={{ padding: "0.75rem", textAlign: "center" }}>{dict.totalBookings}</th>
                </tr>
              </thead>
              <tbody>
                {lotStats.map((lot, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #edf2f7" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 600, textAlign: "left" }}>{lot.name}</td>
                    <td style={{ padding: "0.75rem", textAlign: "center" }}>{lot.spacesCount}</td>
                    <td style={{ padding: "0.75rem", textAlign: "center", color: "var(--primary-color)" }}>{lot.weekCount}</td>
                    <td style={{ padding: "0.75rem", textAlign: "center", color: "var(--primary-color)" }}>{lot.monthCount}</td>
                    <td style={{ padding: "0.75rem", textAlign: "center", fontWeight: 600 }}>{lot.totalCount}</td>
                  </tr>
                ))}
                {lotStats.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                      {dict.none}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Space stats */}
        <div className="surface" style={{ display: "flex", flexDirection: "column", margin: 0 }}>
          <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>{dict.statsSpaces}</h3>
          <div style={{ overflowX: "auto", maxHeight: "350px", overflowY: "auto" }}>
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>{dict.spaceName}</th>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>{dict.lotName}</th>
                  <th style={{ padding: "0.75rem", textAlign: "center" }}>{dict.activeWeek}</th>
                  <th style={{ padding: "0.75rem", textAlign: "center" }}>{dict.activeMonth}</th>
                  <th style={{ padding: "0.75rem", textAlign: "center" }}>{dict.totalBookings}</th>
                </tr>
              </thead>
              <tbody>
                {spaceStats.map((space, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #edf2f7" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 600, textAlign: "left" }}>
                      <span className="badge badge-blue">{space.name}</span>
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "left" }}>{space.lotName}</td>
                    <td style={{ padding: "0.75rem", textAlign: "center", color: "var(--primary-color)" }}>{space.weekCount}</td>
                    <td style={{ padding: "0.75rem", textAlign: "center", color: "var(--primary-color)" }}>{space.monthCount}</td>
                    <td style={{ padding: "0.75rem", textAlign: "center", fontWeight: 600 }}>{space.totalCount}</td>
                  </tr>
                ))}
                {spaceStats.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                      {dict.none}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Stats Table (Existing, refactored header) */}
      <div className="surface" style={{ overflowX: "auto", margin: 0 }}>
        <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>{dict.user}</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.08)" }}>
              <th style={{ padding: "1rem" }}>{dict.user}</th>
              <th style={{ padding: "1rem" }}>{dict.activeWeek}</th>
              <th style={{ padding: "1rem" }}>{dict.activeMonth}</th>
              <th style={{ padding: "1rem", opacity: 0.6 }}>{dict.canceledWeek}</th>
              <th style={{ padding: "1rem", opacity: 0.6 }}>{dict.canceledMonth}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((stat, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.04)" }}>
                <td style={{ padding: "1rem", fontWeight: 600 }}>{stat.name}</td>
                <td style={{ padding: "1rem", color: "var(--color-primary)" }}>{stat.weekActive}</td>
                <td style={{ padding: "1rem", color: "var(--color-primary)" }}>{stat.monthActive}</td>
                <td style={{ padding: "1rem", opacity: 0.6 }}>{stat.weekCanceled}</td>
                <td style={{ padding: "1rem", opacity: 0.6 }}>{stat.monthCanceled}</td>
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
