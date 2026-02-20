import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";
import { SentryProvider } from "@/components/providers/SentryProvider";
import { Toaster } from "@/components/ui/sonner"; // Importando o Toaster

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
});

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
        <SentryProvider>
          <UserProvider>
            {children}
            <Toaster richColors /> {/* Adicionando o componente Toaster */}
          </UserProvider>
        </SentryProvider>
      </body>
    </html>
  );
}
