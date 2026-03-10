import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin App",
  description: "Aplicación de Administración Empresarial",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} antialiased bg-gray-50 text-gray-900`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
