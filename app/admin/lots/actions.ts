"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createLot(data: FormData) {
  const name = data.get("name") as string;
  if (!name) return { error: "Name required" };

  try {
    await prisma.parkingLot.create({ data: { name } });
    revalidatePath("/admin/lots");
  } catch (e) {
    // ignore or handle
  }
}

export async function deleteLot(id: string) {
  try {
    await prisma.parkingLot.delete({ where: { id } });
    revalidatePath("/admin/lots");
  } catch (e) {}
}

export async function createSpace(data: FormData) {
  const name = data.get("name") as string;
  const lotId = data.get("lotId") as string;
  if (!name || !lotId) return { error: "Missing fields" };

  try {
    await prisma.parkingSpace.create({ data: { name, lotId } });
    revalidatePath("/admin/lots");
  } catch (e) {}
}

export async function deleteSpace(id: string) {
  try {
    await prisma.parkingSpace.delete({ where: { id } });
    revalidatePath("/admin/lots");
  } catch (e) {}
}
