import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#f7f4ed",
};

export const metadata: Metadata = {
  title: "Royal Wedding Invitation Planner Studio",
  description: "A luxury cinematic South Indian wedding invitation experience.",
  icons: {
    icon: "/Hari_WEDDING_project_logo.png",
    shortcut: "/Hari_WEDDING_project_logo.png",
    apple: "/Hari_WEDDING_project_logo.png"
  }
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
