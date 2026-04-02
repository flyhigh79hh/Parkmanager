import { prisma } from "@/lib/prisma";
import { getDictionary, Locale } from "@/lib/i18n";
import { cookies, headers } from "next/headers";
import { cancelBooking } from "@/app/booking/actions";
import Link from "next/link";

export default async function StatusPage({ searchParams }: { searchParams: Promise<{ showAll?: string }> }) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value || "de") as Locale;
  const dict = getDictionary(locale).status;

  const headersList = await headers();
  const basicAuth = headersList.get('authorization');
  let isAdmin = false;

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = Buffer.from(authValue, 'base64').toString('utf-8').split(':');
    const validUser = process.env.ADMIN_USERNAME || 'admin';
    const validPwd = process.env.ADMIN_PASSWORD || 'admin';
    if (user === validUser && pwd === validPwd) {
      isAdmin = true;
    }
  }

  // Detect if loaded inside an iframe (via Sec-Fetch-Dest header)
  const fetchDest = headersList.get('sec-fetch-dest');
  const isIframe = fetchDest === 'iframe';

  const params = await searchParams;
  const showAll = params?.showAll === '1' && !isIframe;

  const getNextBusinessDays = (startDate: Date, count: number) => {
    const days = [];
    let current = new Date(startDate);
    days.push(new Date(current));
    for (let i = 1; i < count; i++) {
      current.setDate(current.getDate() + 1);
      while (current.getDay() === 0 || current.getDay() === 6) {
        current.setDate(current.getDate() + 1);
      }
      days.push(new Date(current));
    }
    return days;
  };

  const dateFormatter = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  const embedCode = `<iframe src="http://your-server-domain:3000/status" width="100%" height="600px" style="border:none;"></iframe>`;

  if (showAll) {
    // Fetch all future bookings (from today onward)
    const todayStr = new Date().toISOString().split('T')[0];

    const allBookings = await prisma.booking.findMany({
      where: { date: { gte: todayStr } },
      include: { user: true, space: { include: { lot: true } } },
      orderBy: [{ date: 'asc' }, { space: { lotId: 'asc' } }, { space: { name: 'asc' } }]
    });

    // Group by date
    const groupedByDate = allBookings.reduce((acc: Record<string, typeof allBookings>, b) => {
      if (!acc[b.date]) acc[b.date] = [];
      acc[b.date].push(b);
      return acc;
    }, {});

    const sortedDates = Object.keys(groupedByDate).sort();

    const badgeColors = ["badge-blue", "badge-purple", "badge-green", "badge-yellow", "badge-red"];

    return (
      <div className="animate-fade-in" style={{ paddingBottom: "3rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <h2 style={{ margin: 0 }}>{dict.title}</h2>
          <Link href="/status" className="btn btn-secondary" style={{ fontSize: "0.875rem", padding: "0.5rem 1.25rem" }}>
            &larr; {dict.showLess}
          </Link>
        </div>

        {sortedDates.length === 0 ? (
          <div className="surface">
            <p style={{ color: "var(--text-secondary)", fontStyle: "italic", textAlign: "center" }}>{dict.noBookings}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {sortedDates.map((dateStr, idx) => {
              const dateObj = new Date(`${dateStr}T00:00:00`);
              const dayBookings = groupedByDate[dateStr];
              const badge = badgeColors[idx % badgeColors.length];
              return (
                <div key={dateStr} className="surface">
                  <h3 style={{ marginBottom: "1rem" }}>{weekdayFormatter.format(dateObj)}</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{dict.user}</th>
                        <th>{dict.lot}</th>
                        <th>{dict.space}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayBookings.map(b => (
                        <tr key={b.id}>
                          <td style={{ fontWeight: 500 }}>{b.user.name}</td>
                          <td>{b.space.lot.name}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <span className={`badge ${badge}`}>{b.space.name}</span>
                              <form action={cancelBooking}>
                                <input type="hidden" name="bookingId" value={b.id} />
                                <button type="submit" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px', fontSize: '1.2rem', lineHeight: 1 }} title={dict.cancelBooking}>&times;</button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {isAdmin && (
          <div className="surface" style={{ marginTop: "2rem", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <h4>{dict.embedInfo}</h4>
            <pre style={{ background: "#0f172a", color: "#f8fafc", padding: "1.25rem", borderRadius: "8px", overflowX: "auto", fontSize: "0.875rem", boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)" }}>
              <code>{embedCode}</code>
            </pre>
          </div>
        )}
      </div>
    );
  }

  // Default 3-day view
  const dates = getNextBusinessDays(new Date(), 3);
  const d1 = dates[0].toISOString().split('T')[0];
  const d2 = dates[1].toISOString().split('T')[0];
  const d3 = dates[2].toISOString().split('T')[0];

  const d1Str = dateFormatter.format(dates[0]);
  const d2Str = dateFormatter.format(dates[1]);
  const d3Str = dateFormatter.format(dates[2]);

  const bookings = await prisma.booking.findMany({
    where: { date: { in: [d1, d2, d3] } },
    include: { user: true, space: { include: { lot: true } } },
    orderBy: [{ date: 'asc' }, { space: { lotId: 'asc' } }, { space: { name: 'asc' } }]
  });

  const todayBookings = bookings.filter(b => b.date === d1);
  const nextDayBookings = bookings.filter(b => b.date === d2);
  const thirdDayBookings = bookings.filter(b => b.date === d3);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <h2 style={{ margin: 0 }}>{dict.title}</h2>
        {!isIframe && (
          <Link href="/status?showAll=1" className="btn btn-secondary" style={{ fontSize: "0.875rem", padding: "0.5rem 1.25rem" }}>
            {dict.showAll}
          </Link>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "2rem" }}>
        <div className="surface">
          <h3>{dict.today} ({d1Str})</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>{dict.user}</th>
                <th>{dict.lot}</th>
                <th>{dict.space}</th>
              </tr>
            </thead>
            <tbody>
              {todayBookings.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 500 }}>{b.user.name}</td>
                  <td>{b.space.lot.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span className="badge badge-blue">{b.space.name}</span>
                      <form action={cancelBooking}>
                        <input type="hidden" name="bookingId" value={b.id} />
                        <button type="submit" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px', fontSize: '1.2rem', lineHeight: 1 }} title={dict.cancelBooking}>&times;</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {todayBookings.length === 0 && (
                <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--text-secondary)" }}>{dict.noBookings}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="surface">
          <h3>{dict.nextDay} ({d2Str})</h3>
           <table className="data-table">
            <thead>
              <tr>
                <th>{dict.user}</th>
                <th>{dict.lot}</th>
                <th>{dict.space}</th>
              </tr>
            </thead>
            <tbody>
              {nextDayBookings.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 500 }}>{b.user.name}</td>
                  <td>{b.space.lot.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span className="badge badge-purple">{b.space.name}</span>
                      <form action={cancelBooking}>
                        <input type="hidden" name="bookingId" value={b.id} />
                        <button type="submit" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px', fontSize: '1.2rem', lineHeight: 1 }} title={dict.cancelBooking}>&times;</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {nextDayBookings.length === 0 && (
                <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--text-secondary)" }}>{dict.noBookings}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="surface">
          <h3>{dict.followingDay} ({d3Str})</h3>
           <table className="data-table">
            <thead>
              <tr>
                <th>{dict.user}</th>
                <th>{dict.lot}</th>
                <th>{dict.space}</th>
              </tr>
            </thead>
            <tbody>
              {thirdDayBookings.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 500 }}>{b.user.name}</td>
                  <td>{b.space.lot.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span className="badge badge-green">{b.space.name}</span>
                      <form action={cancelBooking}>
                        <input type="hidden" name="bookingId" value={b.id} />
                        <button type="submit" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px', fontSize: '1.2rem', lineHeight: 1 }} title={dict.cancelBooking}>&times;</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {thirdDayBookings.length === 0 && (
                <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--text-secondary)" }}>{dict.noBookings}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && (
        <div className="surface" style={{ marginTop: "2rem", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <h4>{dict.embedInfo}</h4>
          <pre style={{ background: "#0f172a", color: "#f8fafc", padding: "1.25rem", borderRadius: "8px", overflowX: "auto", fontSize: "0.875rem", boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)" }}>
            <code>{embedCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
