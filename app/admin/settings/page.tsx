import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { saveSettings } from "./actions";
import { getDictionary, Locale } from "@/lib/i18n";
import { cookies } from "next/headers";

export default async function SettingsAdminPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value || "de") as Locale;
  const dict = getDictionary(locale).adminSettings;

  const settings = await prisma.setting.findMany();
  
  const getVal = (key: string, def: string) => settings.find(s => s.key === key)?.value || def;
  
  const normalLimit = getVal("FAIRNESS_MAX_SPOTS_NORMAL", "3");
  const managementLimit = getVal("FAIRNESS_MAX_SPOTS_MANAGEMENT", "5");
  const restrictionTimeframe = getVal("RESTRICTION_TIMEFRAME_HOURS", "24");
  const normalHorizon = getVal("BOOKING_HORIZON_DAYS_NORMAL", "14");
  const managementHorizon = getVal("BOOKING_HORIZON_DAYS_MANAGEMENT", "30");
  const specialHorizon = getVal("BOOKING_HORIZON_DAYS_SPECIAL", "60");

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2>{dict.title}</h2>
        <Link href="/admin" className="btn btn-secondary" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>&larr; {dict.back}</Link>
      </div>

      <div className="surface" style={{ maxWidth: "600px" }}>
        <form action={saveSettings} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div style={{ paddingBottom: "1rem", borderBottom: "1px solid #e2e8f0" }}>
            <h4 style={{ margin: "0 0 1.25rem 0", color: "var(--text-primary)", fontSize: "1rem" }}>{dict.fairnessSection}</h4>

            <div className="input-group" style={{ marginBottom: "1rem" }}>
              <label className="input-label">{dict.normalLimit}</label>
              <p style={{ fontSize: "0.875rem", marginTop: 0, marginBottom: "0.5rem", color: "var(--text-secondary)" }}>{dict.normalDesc}</p>
              <input type="number" min="1" max="7" name="FAIRNESS_MAX_SPOTS_NORMAL" defaultValue={normalLimit} className="input-field" required />
            </div>

            <div className="input-group" style={{ marginBottom: "1rem" }}>
              <label className="input-label">{dict.mgmtLimit}</label>
              <p style={{ fontSize: "0.875rem", marginTop: 0, marginBottom: "0.5rem", color: "var(--text-secondary)" }}>{dict.mgmtDesc}</p>
              <input type="number" min="1" max="7" name="FAIRNESS_MAX_SPOTS_MANAGEMENT" defaultValue={managementLimit} className="input-field" required />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">{dict.restriction}</label>
              <p style={{ fontSize: "0.875rem", marginTop: 0, marginBottom: "0.5rem", color: "var(--text-secondary)" }}>{dict.restrictionDesc}</p>
              <input type="number" min="0" max="168" name="RESTRICTION_TIMEFRAME_HOURS" defaultValue={restrictionTimeframe} className="input-field" required />
            </div>
          </div>

          <div>
            <h4 style={{ margin: "0 0 1.25rem 0", color: "var(--text-primary)", fontSize: "1rem" }}>{dict.horizonSection}</h4>

            <div className="input-group" style={{ marginBottom: "1rem" }}>
              <label className="input-label">{dict.normalHorizon}</label>
              <p style={{ fontSize: "0.875rem", marginTop: 0, marginBottom: "0.5rem", color: "var(--text-secondary)" }}>{dict.normalHorizonDesc}</p>
              <input type="number" min="1" max="365" name="BOOKING_HORIZON_DAYS_NORMAL" defaultValue={normalHorizon} className="input-field" required />
            </div>

            <div className="input-group" style={{ marginBottom: "1rem" }}>
              <label className="input-label">{dict.mgmtHorizon}</label>
              <p style={{ fontSize: "0.875rem", marginTop: 0, marginBottom: "0.5rem", color: "var(--text-secondary)" }}>{dict.mgmtHorizonDesc}</p>
              <input type="number" min="1" max="365" name="BOOKING_HORIZON_DAYS_MANAGEMENT" defaultValue={managementHorizon} className="input-field" required />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">{dict.specialHorizon}</label>
              <p style={{ fontSize: "0.875rem", marginTop: 0, marginBottom: "0.5rem", color: "var(--text-secondary)" }}>{dict.specialHorizonDesc}</p>
              <input type="number" min="1" max="365" name="BOOKING_HORIZON_DAYS_SPECIAL" defaultValue={specialHorizon} className="input-field" required />
            </div>
          </div>

          <div style={{ padding: "1.25rem", background: "#f0f9ff", borderRadius: "12px", border: "1px solid #bae6fd" }}>
            <h4 style={{ margin: "0 0 0.5rem 0", color: "#0369a1" }}>{dict.howItWorks}</h4>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#0c4a6e", lineHeight: 1.5 }}>
              {dict.howItWorksText1}<strong>{restrictionTimeframe} {locale === 'en' ? 'hours' : 'Stunden'}</strong>{dict.howItWorksText2}
            </p>
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start", marginTop: "0.5rem" }}>{dict.saveBtn}</button>
        </form>
      </div>
    </div>
  );
}
