import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";
import { Toaster } from "@/components/ui/sonner"; // Importando o Toaster
import { TooltipProvider } from '@/components/ui/tooltip';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Comunikapp",
  description: "Gestão para comunicação visual",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <TooltipProvider>
          <UserProvider>
            {children}
            <Toaster richColors /> {/* Adicionando o componente Toaster */}
          </UserProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
