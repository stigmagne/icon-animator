import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Icon Animator",
    template: "%s | Icon Animator",
  },
  description:
    "A visual tool for creating animated SVG icons with motion/react code output. Paste any SVG, animate it visually, and copy a ready-to-use React component.",
  openGraph: {
    title: "Icon Animator",
    description:
      "Paste SVG → Animate visually → Copy ready React component with motion/react",
    type: "website",
    siteName: "Icon Animator",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
