import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { AppShell } from "@/components/layout/AppShell";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ASTRA | Digital Risk Protection Platform",
  description: "Connect suspicious social, web, and app sightings into explainable brand-protection campaigns.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_ZGVzdGluZWQtc2VhaG9yc2UtOTU4NC5jbGVyay5hY2NvdW50cy5kZXYk";

  return (
    <html lang="en">
      <body className={`${inter.variable} ${mono.variable} font-sans antialiased min-h-screen bg-slate-50 text-slate-900`}>
        <ClerkProvider publishableKey={clerkPublishableKey}>
          <QueryProvider>
            <AppShell>{children}</AppShell>
          </QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
