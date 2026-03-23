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

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const next30 = new Date(today);
  next30.setDate(today.getDate() + 30);
  const next30Str = next30.toISOString().split('T')[0];

  const bookingsInfo = await prisma.booking.findMany({
    where: { date: { gte: todayStr, lte: next30Str } },
    select: { spaceId: true, date: true }
  });

  return (
    <div className="animate-fade-in" style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "3rem" }}>
      <h2 style={{ marginBottom: "2rem", textAlign: "center" }}>{dict.title}</h2>
      <BookingClient users={users} lots={lots} bookingsInfo={bookingsInfo} dict={dict} />
    </div>
  );
}
