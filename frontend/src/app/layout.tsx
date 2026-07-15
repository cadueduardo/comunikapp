import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";
import { SentryProvider } from "@/components/providers/SentryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner"; // Importando o Toaster
import { BRAND_ASSETS } from "@/lib/brand";
import { siteMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = {
  ...siteMetadata,
  icons: {
    icon: [{ url: BRAND_ASSETS.favicon, type: "image/svg+xml" }],
    shortcut: BRAND_ASSETS.favicon,
    apple: BRAND_ASSETS.favicon,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider>
          <SentryProvider>
            <UserProvider>
              {children}
              <Toaster richColors /> {/* Adicionando o componente Toaster */}
            </UserProvider>
          </SentryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
