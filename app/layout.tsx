import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bug Analytics",
  description: "Excel-based project bug analytics dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}