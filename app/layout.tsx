import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // Link previews need absolute image URLs; the images come from app/opengraph-image.png and app/twitter-image.png.
  metadataBase: new URL("https://mac-cs-2030.vercel.app"),
  title: "Mac CS 2030",
  description: "mac cs 30 class profile",
  openGraph: {
    title: "mac cs ’30",
    description: "mac cs 30 class profile",
    siteName: "Mac CS 2030",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "mac cs ’30",
    description: "mac cs 30 class profile",
  },
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
