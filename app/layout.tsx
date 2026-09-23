import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title:"Ananya & Karthik — A Beautiful Beginning", description:"With the blessings of our families, join us for a beautiful beginning. A cinematic South Indian wedding invitation.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
