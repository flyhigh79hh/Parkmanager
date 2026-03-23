import { prisma } from "@/lib/prisma";
import { createUser, deleteUser } from "./actions";
import Link from "next/link";

export default async function UsersAdminPage() {
  const users = await prisma.user.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2>Manage Users</h2>
        <Link href="/admin" className="btn btn-secondary" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>&larr; Back to Dashboard</Link>
      </div>
      
      <div className="surface" style={{ marginBottom: "2rem" }}>
        <h3>Add New User</h3>
        <form action={createUser} style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: "200px" }}>
            <label className="input-label">Name</label>
            <input type="text" name="name" className="input-field" required placeholder="John Doe" />
          </div>
          <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: "200px" }}>
            <label className="input-label">Role</label>
            <select name="role" className="input-field" required>
              <option value="NORMAL">Normal</option>
              <option value="MANAGEMENT">Management</option>
              <option value="SPECIAL_NEEDS">Special Needs</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Add User</button>
        </form>
      </div>

      <div className="surface">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>
                  <span className={`badge ${user.role === 'MANAGEMENT' ? 'badge-purple' : user.role === 'SPECIAL_NEEDS' ? 'badge-blue' : 'badge-green'}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <form action={async () => {
                    "use server";
                    await deleteUser(user.id);
                  }}>
                    <button type="submit" className="btn btn-danger" style={{ padding: "0.25rem 0.5rem", fontSize: "0.875rem" }}>Remove</button>
                  </form>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", paddingTop: "2rem", color: "var(--text-secondary)" }}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
