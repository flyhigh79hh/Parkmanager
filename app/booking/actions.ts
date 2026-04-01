"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function bookSpace(data: FormData) {
  const userId = data.get("userId") as string;
  const spaceId = data.get("spaceId") as string;
  const dateStr = data.get("date") as string; // YYYY-MM-DD

  if (!userId || !spaceId || !dateStr) return { error: "Missing required fields" };

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "User not found" };

    // 1. One spot per user per day check
    const existingDayBooking = await prisma.booking.findFirst({
      where: { userId, date: dateStr }
    });
    if (existingDayBooking) return { error: "You already have a booking for this day" };

    const spaceAlreadyBooked = await prisma.booking.findFirst({
      where: { spaceId, date: dateStr }
    });
    if (spaceAlreadyBooked) return { error: "This space is already booked on this date" };

    if (user.role !== "SPECIAL_NEEDS") {
      const settings = await prisma.setting.findMany();
      const getVal = (key: string, def: string) => settings.find(s => s.key === key)?.value || def;

      const restrictionHours = parseInt(getVal("RESTRICTION_TIMEFRAME_HOURS", "24"));
      
      const targetDate = new Date(`${dateStr}T00:00:00`);
      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // If we are outside the restriction lifted timeframe, apply weekly limits
      if (diffHours >= restrictionHours) {
        // Find Monday and Sunday of the target date's week
        const d = new Date(targetDate);
        const day = d.getDay() || 7; // Sunday=7
        d.setDate(d.getDate() - day + 1);
        const mondayStr = d.toISOString().split('T')[0];
        
        const d2 = new Date(d);
        d2.setDate(d2.getDate() + 6);
        const sundayStr = d2.toISOString().split('T')[0];

        const weeklyBookings = await prisma.booking.count({
          where: {
            userId,
            date: { gte: mondayStr, lte: sundayStr }
          }
        });

        const limit = parseInt(getVal(`FAIRNESS_MAX_SPOTS_${user.role}`, user.role === 'NORMAL' ? "3" : "5"));
        if (weeklyBookings >= limit) {
          return { error: `Weekly fairness limit reached (${limit} spots max). You cannot book more spaces this week unless you wait until ${restrictionHours} hours before the target date.` };
        }
      }
    }

    await prisma.booking.create({
      data: { userId, spaceId, date: dateStr }
    });

    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "Unknown IP";

    await prisma.actionLog.create({
      data: {
        action: "BOOK",
        ipAddress: ip,
        userId: userId,
        details: JSON.stringify({ spaceId, date: dateStr })
      }
    });

    revalidatePath("/status");
    revalidatePath("/booking");

    return { success: true };

  } catch (e: any) {
    return { error: e.message || "An error occurred" };
  }
}

export async function cancelBooking(data: FormData) {
  const bookingId = data.get("bookingId") as string;
  if (!bookingId) return;

  try {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return;

    await prisma.booking.delete({ where: { id: bookingId } });

    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "Unknown IP";

    await prisma.actionLog.create({
      data: {
        action: "CANCEL",
        ipAddress: ip,
        userId: booking.userId,
        details: JSON.stringify({ spaceId: booking.spaceId, date: booking.date })
      }
    });

    revalidatePath("/status");
    revalidatePath("/booking");
  } catch (e: any) {
    console.error(e);
  }
}
