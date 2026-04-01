import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { createLot, deleteLot, createSpace, deleteSpace } from "./actions";
import { getDictionary, Locale } from "@/lib/i18n";
import { cookies } from "next/headers";

export default async function LotsAdminPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value || "de") as Locale;
  const dict = getDictionary(locale).adminLots;

  const lots = await prisma.parkingLot.findMany({ include: { spaces: true }, orderBy: { name: 'asc' } });

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2>{dict.title}</h2>
        <Link href="/admin" className="btn btn-secondary" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>&larr; {dict.back}</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem", alignItems: "start" }}>
        <div>
          <div className="surface" style={{ marginBottom: "2rem" }}>
            <h3>{dict.createLot}</h3>
            <form action={createLot} style={{ display: "flex", gap: "1rem" }}>
              <input type="text" name="name" className="input-field" required placeholder={dict.lotName} style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary">{dict.createBtn}</button>
            </form>
          </div>
          
          <div className="surface">
            <h3>{dict.addSpace}</h3>
            <form action={createSpace} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">{dict.lot}</label>
                <select name="lotId" className="input-field" required>
                  {lots.map(lot => <option key={lot.id} value={lot.id}>{lot.name}</option>)}
                  {lots.length === 0 && <option value="" disabled>{dict.noLotsOpt}</option>}
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">{dict.spaceName}</label>
                <input type="text" name="name" className="input-field" required placeholder={dict.spacePlaceholder} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>{dict.addSpaceBtn}</button>
            </form>
          </div>
        </div>

        <div className="surface">
          <h3>{dict.existing}</h3>
          {lots.map(lot => (
            <div key={lot.id} style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #edf2f7" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h4 style={{ margin: 0 }}>{lot.name}</h4>
                <form action={async () => {
                  "use server";
                  await deleteLot(lot.id);
                }}>
                  <button type="submit" className="btn btn-danger" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>{dict.deleteLot}</button>
                </form>
              </div>
              
              {lot.spaces.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {lot.spaces.map(space => (
                    <div key={space.id} style={{ background: "#edf2f7", padding: "0.25rem 0.75rem", borderRadius: "1rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span>{space.name}</span>
                      <form action={async () => {
                        "use server";
                        await deleteSpace(space.id);
                      }}>
                        <button type="submit" style={{ background: "none", border: "none", color: "var(--danger-color)", cursor: "pointer", padding: 0, fontSize: "1rem", lineHeight: 1 }}>&times;</button>
                      </form>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>{dict.noSpaces}</p>
              )}
            </div>
          ))}
          {lots.length === 0 && <p style={{ color: "var(--text-secondary)" }}>{dict.noLots}</p>}
        </div>
      </div>
    </div>
  );
}
