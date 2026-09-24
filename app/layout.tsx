import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Royal Wedding Invitation Planner Studio",
  description: "A luxury cinematic South Indian wedding invitation experience.",
  icons: {
    icon: "/Hari_WEDDING_project_logo_final.png",
    shortcut: "/Hari_WEDDING_project_logo_final.png",
    apple: "/Hari_WEDDING_project_logo_final.png"
  }
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
