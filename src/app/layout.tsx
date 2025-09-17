import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { NotificationTray } from "@/components/NotificationTray";

export const metadata: Metadata = {
  title: "Pixel Animator",
  description:
    "Create stunning black and white generative animations with artistic effects and seamless export capabilities.",
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
        <Analytics />
      </body>
    </html>
  );
}
