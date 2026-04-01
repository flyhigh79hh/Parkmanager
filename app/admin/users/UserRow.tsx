"use client";

import { useTransition } from "react";
import { deleteUser, updateUserRole } from "./actions";

export default function UserRow({ user, dict }: { user: any, dict: any }) {
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    startTransition(async () => {
      await updateUserRole(user.id, newRole);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteUser(user.id);
    });
  };

  return (
    <tr style={{ opacity: isPending ? 0.6 : 1, transition: "opacity 0.2s" }}>
      <td>{user.name}</td>
      <td>
        <select 
          value={user.role} 
          onChange={handleRoleChange}
          disabled={isPending}
          className="input-field"
          style={{ 
            padding: "0.25rem 0.5rem", 
            marginBottom: 0, 
            minWidth: "150px",
            background: "var(--surface)",
            color: "var(--text-primary)"
          }}
        >
          <option value="NORMAL">{dict.roleNormal}</option>
          <option value="MANAGEMENT">{dict.roleManagement}</option>
          <option value="SPECIAL_NEEDS">{dict.roleSpecial}</option>
        </select>
      </td>
      <td>
        <button 
          type="button" 
          onClick={handleDelete}
          disabled={isPending}
          className="btn btn-danger" 
          style={{ padding: "0.25rem 0.5rem", fontSize: "0.875rem" }}
        >
          {dict.remove}
        </button>
      </td>
    </tr>
  );
}
