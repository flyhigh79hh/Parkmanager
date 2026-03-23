import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { createLot, deleteLot, createSpace, deleteSpace } from "./actions";

export default async function LotsAdminPage() {
  const lots = await prisma.parkingLot.findMany({ include: { spaces: true }, orderBy: { name: 'asc' } });

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2>Manage Parking Lots</h2>
        <Link href="/admin" className="btn btn-secondary" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>&larr; Back to Dashboard</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem", alignItems: "start" }}>
        <div>
          <div className="surface" style={{ marginBottom: "2rem" }}>
            <h3>Create Parking Lot</h3>
            <form action={createLot} style={{ display: "flex", gap: "1rem" }}>
              <input type="text" name="name" className="input-field" required placeholder="Lot Name" style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary">Create Lot</button>
            </form>
          </div>
          
          <div className="surface">
            <h3>Add Space to Lot</h3>
            <form action={createSpace} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Parking Lot</label>
                <select name="lotId" className="input-field" required>
                  {lots.map(lot => <option key={lot.id} value={lot.id}>{lot.name}</option>)}
                  {lots.length === 0 && <option value="" disabled>No lots available</option>}
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Space Name/Number</label>
                <input type="text" name="name" className="input-field" required placeholder="e.g. A1" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>Add Space</button>
            </form>
          </div>
        </div>

        <div className="surface">
          <h3>Existing Lots & Spaces</h3>
          {lots.map(lot => (
            <div key={lot.id} style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #edf2f7" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h4 style={{ margin: 0 }}>{lot.name}</h4>
                <form action={async () => {
                  "use server";
                  await deleteLot(lot.id);
                }}>
                  <button type="submit" className="btn btn-danger" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>Delete Lot</button>
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
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>No spaces in this lot.</p>
              )}
            </div>
          ))}
          {lots.length === 0 && <p style={{ color: "var(--text-secondary)" }}>No parking lots created yet.</p>}
        </div>
      </div>
    </div>
  );
}
