import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tiquet · Controla lo que gastas",
    short_name: "Tiquet",
    description:
      "Escanea tus tickets de compra, digitalízalos y consulta el total gastado cada mes. Todo se guarda en tu dispositivo.",
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
        name: "Escanear ticket",
        short_name: "Escanear",
        description: "Haz una foto a un ticket y guárdalo",
        url: "/scan",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Añadir ticket a mano",
        short_name: "Añadir",
        description: "Introduce los datos de un ticket manualmente",
        url: "/receipts/new",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
