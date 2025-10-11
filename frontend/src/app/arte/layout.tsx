import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aprovação de Arte - Comunikapp",
  description: "Sistema de aprovação de artes",
};

export default function ArteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout público sem UserProvider
  return <>{children}</>;
}


