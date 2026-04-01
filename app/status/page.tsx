import { prisma } from "@/lib/prisma";
import { getDictionary, Locale } from "@/lib/i18n";
import { cookies, headers } from "next/headers";
import { cancelBooking } from "@/app/booking/actions";

export default async function StatusPage() {
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

  const dates = getNextBusinessDays(new Date(), 3);
  const d1 = dates[0].toISOString().split('T')[0];
  const d2 = dates[1].toISOString().split('T')[0];
  const d3 = dates[2].toISOString().split('T')[0];

  const dateFormatter = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
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

  const embedCode = `<iframe src="http://your-server-domain:3000/status" width="100%" height="600px" style="border:none;"></iframe>`;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "3rem" }}>
      <h2 style={{ marginBottom: "2rem" }}>{dict.title}</h2>

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
