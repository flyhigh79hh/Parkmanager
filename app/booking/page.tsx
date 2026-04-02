import { prisma } from "@/lib/prisma";
import BookingClient from "./BookingClient";
import { getDictionary, Locale } from "@/lib/i18n";
import { cookies } from "next/headers";

export default async function BookingPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value || "de") as Locale;
  const dict = getDictionary(locale).booking;

  const users = await prisma.user.findMany({ orderBy: { name: 'asc' } });
  const lots = await prisma.parkingLot.findMany({ include: { spaces: true }, orderBy: { name: 'asc' } });

  // Fetch the maximum booking horizon across all roles so we load enough bookings
  const settings = await prisma.setting.findMany();
  const getVal = (key: string, def: string) => settings.find(s => s.key === key)?.value || def;

  const horizons = {
    NORMAL: parseInt(getVal("BOOKING_HORIZON_DAYS_NORMAL", "14")),
    MANAGEMENT: parseInt(getVal("BOOKING_HORIZON_DAYS_MANAGEMENT", "30")),
    SPECIAL_NEEDS: parseInt(getVal("BOOKING_HORIZON_DAYS_SPECIAL", "60")),
  };

  const maxHorizon = Math.max(horizons.NORMAL, horizons.MANAGEMENT, horizons.SPECIAL_NEEDS);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + maxHorizon);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const bookingsInfo = await prisma.booking.findMany({
    where: { date: { gte: todayStr, lte: maxDateStr } },
    select: {
      id: true,
      userId: true,
      spaceId: true,
      date: true,
      space: {
        include: {
          lot: true
        }
      }
    },
    orderBy: { date: 'asc' }
  });

  return (
    <div className="animate-fade-in" style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "3rem" }}>
      <h2 style={{ marginBottom: "2rem", textAlign: "center" }}>{dict.title}</h2>
      <BookingClient users={users} lots={lots} bookingsInfo={bookingsInfo} dict={dict} horizons={horizons} />
    </div>
  );
}
