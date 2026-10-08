import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus Network QoS Simulator",
  description: "Browser-based campus network lab with DHCP, DNS, OSPF, and QoS",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
