import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-mono",
});

export const metadata: Metadata = {
  title: "LockedIn",
  description: "Focus sessions that turn into progress.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full`}>
      <body className="min-h-full font-sans antialiased">
        <ClerkProvider
          appearance={{
            variables: {
              colorBackground: "#111113",
              colorForeground: "#fafafa",
              colorPrimary: "#fafafa",
              colorPrimaryForeground: "#09090b",
              colorInput: "#18181b",
              colorInputForeground: "#fafafa",
              colorMutedForeground: "#a1a1aa",
              colorBorder: "#27272a",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
