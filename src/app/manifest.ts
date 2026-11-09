import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tiquet · Controla lo que gastas",
    short_name: "Tiquet",
    description:
      "Guarda una foto de cada ticket con su importe final, comercio y fecha, y consulta lo que gastas cada mes. Tus datos se sincronizan de forma privada con tu cuenta de Google.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f4ef",
    theme_color: "#0d6b5f",
    lang: "es",
    dir: "ltr",
    categories: ["finance", "productivity", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Añadir ticket",
        short_name: "Añadir",
        description: "Haz una foto a un ticket y apunta el importe final",
        url: "/receipts/new",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Estadísticas",
        short_name: "Stats",
        description: "Consulta lo que gastas cada mes",
        url: "/stats",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
