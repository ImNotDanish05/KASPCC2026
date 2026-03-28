import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import TopProgressBar from "@/components/common/TopProgressBar";

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KAS Management",
  description: "KAS Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <TopProgressBar />
        <ThemeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
