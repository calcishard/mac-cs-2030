import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mac CS 2030",
  description: "mac cs 30 class profile",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
