import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function LogPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value || "de") as Locale;
  const dict = getDictionary(locale).admin;

  const logs = await prisma.actionLog.findMany({
    orderBy: { timestamp: 'desc' },
    include: {
      user: true
    },
    take: 100 // Limit to last 100 for now to avoid massive queries
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>{dict.log}</h1>
        <Link href="/admin" className="btn" style={{ background: "transparent", color: "white", border: "1px solid white" }}>
          {dict.backToAdmin}
        </Link>
      </div>

      <div className="surface" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <th style={{ padding: "1rem" }}>{dict.date}</th>
              <th style={{ padding: "1rem" }}>{dict.user}</th>
              <th style={{ padding: "1rem" }}>{dict.action}</th>
              <th style={{ padding: "1rem" }}>{dict.ip}</th>
              <th style={{ padding: "1rem" }}>{dict.details}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <td style={{ padding: "1rem", whiteSpace: "nowrap" }}>{new Date(log.timestamp).toLocaleString(locale === 'en' ? 'en-US' : 'de-DE')}</td>
                <td style={{ padding: "1rem" }}>{log.user?.name || log.userId}</td>
                <td style={{ padding: "1rem" }}>
                  <span style={{ 
                    padding: "0.25rem 0.5rem", 
                    borderRadius: "4px", 
                    fontSize: "0.85em",
                    fontWeight: 600,
                    backgroundColor: log.action === 'BOOK' ? 'var(--primary-color)' : 'var(--danger-color)',
                    color: '#fff'
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: "1rem", whiteSpace: "nowrap" }}>{log.ipAddress}</td>
                <td style={{ padding: "1rem", fontSize: "0.85rem", opacity: 0.8, maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {log.details}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "2rem", textAlign: "center", fontStyle: "italic", opacity: 0.5 }}>
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
