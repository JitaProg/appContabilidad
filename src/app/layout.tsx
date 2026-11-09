import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { BottomNav } from "@/components/bottom-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// La app carga la sesión y los tickets en el cliente. Las navegaciones no
// pueden ser instantáneas hasta que Supabase responde, así que desactivamos
// la validación de navegación instantánea para este árbol de rutas.
export const instant = false;

export const metadata: Metadata = {
  title: {
    default: "Tiquet · Controla lo que gastas",
    template: "%s · Tiquet",
  },
  description:
    "Guarda una foto de cada ticket con su importe final, comercio y fecha, y consulta lo que gastas cada mes. Tus datos se sincronizan de forma privada con tu cuenta de Google.",
  applicationName: "Tiquet",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tiquet",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f4ef",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper text-ink">
        <AppProviders>
          <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
            <main className="flex-1 pb-32">{children}</main>
            <BottomNav />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
