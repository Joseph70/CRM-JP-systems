import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JP Sistems CRM",
  description: "Panel operativo para gestionar clientes, oportunidades y tareas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
