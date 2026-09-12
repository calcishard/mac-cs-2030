import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mac CS 2030 — Our Class",
  description: "A little corner of the internet for McMaster Computer Science, class of 2030. A student webring and class profile, currently featuring sample profiles and data.",
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
