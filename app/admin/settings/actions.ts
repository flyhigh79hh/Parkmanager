"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveSettings(data: FormData) {
  const normalLimit = data.get("FAIRNESS_MAX_SPOTS_NORMAL") as string;
  const managementLimit = data.get("FAIRNESS_MAX_SPOTS_MANAGEMENT") as string;
  const restrictionTimeframe = data.get("RESTRICTION_TIMEFRAME_HOURS") as string;

  try {
    await prisma.$transaction([
      prisma.setting.upsert({ where: { key: "FAIRNESS_MAX_SPOTS_NORMAL" }, update: { value: normalLimit }, create: { key: "FAIRNESS_MAX_SPOTS_NORMAL", value: normalLimit } }),
      prisma.setting.upsert({ where: { key: "FAIRNESS_MAX_SPOTS_MANAGEMENT" }, update: { value: managementLimit }, create: { key: "FAIRNESS_MAX_SPOTS_MANAGEMENT", value: managementLimit } }),
      prisma.setting.upsert({ where: { key: "RESTRICTION_TIMEFRAME_HOURS" }, update: { value: restrictionTimeframe }, create: { key: "RESTRICTION_TIMEFRAME_HOURS", value: restrictionTimeframe } }),
    ]);
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (e) {
    return { error: "Failed to save settings" };
  }
}
