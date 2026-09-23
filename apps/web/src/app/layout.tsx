import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liftup - Next.js + NestJS + Neon DB",
  description: "Full-stack template featuring Next.js, shadcn/ui, NestJS, and Neon DB (PostgreSQL)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
