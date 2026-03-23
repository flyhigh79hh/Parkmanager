import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import "./globals.css";

export const metadata = {
  title: "Parkmanager",
  description: "Parking Lot Reservation System",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE");
  const locale = (localeCookie?.value === "en" ? "en" : "de") as Locale;
  const dict = getDictionary(locale);

  return (
    <html lang={locale}>
      <body className="animate-fade-in">
        <Header locale={locale} dict={dict.nav} />
        <main className="container" style={{ marginTop: '2rem' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
