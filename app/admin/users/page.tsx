import { prisma } from "@/lib/prisma";
import { createUser } from "./actions";
import UserRow from "./UserRow";
import Link from "next/link";
import { getDictionary, Locale } from "@/lib/i18n";
import { cookies } from "next/headers";

export default async function UsersAdminPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value || "de") as Locale;
  const dict = getDictionary(locale).adminUsers;

  const users = await prisma.user.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2>{dict.title}</h2>
        <Link href="/admin" className="btn btn-secondary" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>&larr; {dict.back}</Link>
      </div>
      
      <div className="surface" style={{ marginBottom: "2rem" }}>
        <h3>{dict.addNew}</h3>
        <form action={createUser} style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: "200px" }}>
            <label className="input-label">{dict.name}</label>
            <input type="text" name="name" className="input-field" required placeholder="John Doe" />
          </div>
          <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: "200px" }}>
            <label className="input-label">{dict.role}</label>
            <select name="role" className="input-field" required>
              <option value="NORMAL">{dict.roleNormal}</option>
              <option value="MANAGEMENT">{dict.roleManagement}</option>
              <option value="SPECIAL_NEEDS">{dict.roleSpecial}</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">{dict.addBtn}</button>
        </form>
      </div>

      <div className="surface">
        <table className="data-table">
          <thead>
            <tr>
              <th>{dict.name}</th>
              <th>{dict.role}</th>
              <th>{dict.actions}</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <UserRow key={user.id} user={user} dict={dict} />
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", paddingTop: "2rem", color: "var(--text-secondary)" }}>{dict.noUsers}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
