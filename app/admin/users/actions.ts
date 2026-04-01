"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createUser(data: FormData) {
  const name = data.get("name") as string;
  const role = data.get("role") as string;
  
  if (!name || !role) return { error: "Missing fields" };

  try {
    await prisma.user.create({ data: { name, role } });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (e) {
    return { error: "User already exists or DB error" };
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/users");
  } catch (e) {
    // ignore or handle error
  }
}

export async function updateUserRole(id: string, newRole: string) {
  try {
    const validRoles = ['NORMAL', 'MANAGEMENT', 'SPECIAL_NEEDS'];
    if (!validRoles.includes(newRole)) return { error: "Invalid role" };

    await prisma.user.update({
      where: { id },
      data: { role: newRole }
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (e) {
    return { error: "Role update failed" };
  }
}
