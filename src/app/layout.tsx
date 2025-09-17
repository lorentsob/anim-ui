import type { Metadata } from "next";
import "./globals.css";
import { NotificationTray } from "@/components/NotificationTray";

export const metadata: Metadata = {
  title: "BW Animator",
  description:
    "Early-2000s monochrome animation editor powered by Next.js and p5.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink font-mono antialiased">
        {children}
        <NotificationTray />
      </body>
    </html>
  );
}
