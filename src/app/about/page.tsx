import type { Metadata } from "next";
import Link from "next/link";
import {
  Camera,
  ChartPie,
  Cloud,
  Download,
  LockKeyhole,
  Smartphone,
} from "lucide-react";
import {
  LEGAL_CONTACT_EMAIL,
  PublicList,
  PublicSection,
  PublicShell,
} from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Sobre Tiquet",
  description:
    "Tiquet es una aplicación web instalable para registrar los gastos de tus tickets con una foto, el importe, el comercio y la fecha, y consultar tus totales mensuales.",
  alternates: { canonical: "/about" },
};

const FEATURES = [
  {
    icon: Camera,
    title: "Foto del ticket",
    text: "Haz una foto con la cámara o elige una imagen de la galería. La app la comprime en tu dispositivo antes de subirla.",
  },
  {
    icon: ChartPie,
    title: "Gastos claros",
    text: "Totales del mes, media diaria, media por ticket, comparación con el mes anterior y ranking de comercios.",
  },
  {
    icon: LockKeyhole,
    title: "Privado por diseño",
    text: "Cada cuenta tiene su propio espacio. Las fotos viven en un bucket privado y se muestran con enlaces temporales.",
  },
  {
    icon: Download,
    title: "Tus datos, tuyos",
    text: "Exporta una copia en ZIP o CSV cuando quieras y borra todos tus tickets desde Ajustes.",
  },
  {
    icon: Smartphone,
    title: "Instalable",
    text: "Funciona en el navegador y se puede instalar como aplicación en el móvil, sin tiendas de aplicaciones.",
  },
  {
    icon: Cloud,
    title: "Sincronizado",
    text: "Tus tickets se guardan en Supabase y aparecen en cualquier dispositivo donde inicies sesión con tu cuenta.",
  },
];

export default function AboutPage() {
  return (
    <PublicShell
      title="Tiquet, tu contabilidad personal sin complicaciones"
      intro="Guarda una foto de cada ticket con su importe final, comercio y fecha, y descubre cuánto gastas cada mes. Sin hojas de cálculo, sin categorías interminables y sin anuncios."
    >
      <section className="grid gap-3 sm:grid-cols-2">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="rounded-2xl border border-line bg-surface/80 p-4"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon className="size-4" />
              </span>
              <h2 className="mt-3 text-sm font-semibold text-ink">{feature.title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">{feature.text}</p>
            </div>
          );
        })}
      </section>

      <PublicSection title="Cómo funciona">
        <ol className="list-decimal space-y-2 pl-5 marker:font-semibold marker:text-brand">
          <li>Entras con tu cuenta de Google. No hay que crear otra contraseña.</li>
          <li>Haces una foto del ticket y escribes el importe final, el comercio y la fecha.</li>
          <li>La foto se guarda en un espacio privado de Supabase asociado a tu cuenta.</li>
          <li>El ticket aparece en tu listado y en las estadísticas del mes correspondiente.</li>
        </ol>
      </PublicSection>

      <PublicSection title="Qué necesitas">
        <p>
          Solo una cuenta de Google y conexión a internet. Tiquet no tiene
          publicidad, compras dentro de la app ni suscripciones. El acceso es
          gratuito.
        </p>
        <p>
          Puedes usar la app desde el navegador del ordenador o del móvil, y
          añadirla a la pantalla de inicio para abrirla como una aplicación.
        </p>
      </PublicSection>

      <PublicSection title="Qué pasa con tus datos">
        <p>
          La cuenta de Google se usa únicamente para identificarte y separar tus
          tickets del resto de usuarios. Guardamos tu nombre, tu correo y tu foto
          de perfil, además de los tickets y las imágenes que tú creas.
        </p>
        <PublicList
          items={[
            "Los tickets y las fotos se alojan en Supabase, en la región eu-west-1 (Irlanda).",
            "No hay analítica, cookies de seguimiento ni publicidad.",
            "Puedes descargar una copia o borrar todos tus datos desde Ajustes.",
            "Tienes todos los detalles en la política de privacidad.",
          ]}
        />
        <p>
          Lee la{" "}
          <Link
            href="/privacy"
            className="font-semibold text-brand underline-offset-2 hover:underline"
          >
            política de privacidad
          </Link>{" "}
          y los{" "}
          <Link
            href="/terms"
            className="font-semibold text-brand underline-offset-2 hover:underline"
          >
            términos de uso
          </Link>
          .
        </p>
      </PublicSection>

      <PublicSection title="Sobre el proyecto">
        <p>
          Tiquet es un proyecto personal centrado en una idea sencilla: que
          apuntar un gasto cueste menos que encontrar el ticket en el bolsillo.
          Si tienes una sugerencia, un problema o una duda sobre tus datos,
          escríbenos a{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="font-semibold text-brand underline-offset-2 hover:underline"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      </PublicSection>

      <section className="rounded-2xl bg-brand p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <p className="text-lg font-semibold tracking-tight">Empieza a ordenar tus gastos</p>
          <p className="mt-1 text-sm leading-relaxed text-white/80">
            Entra con Google y registra tu primer ticket en menos de un minuto.
          </p>
        </div>
        <Link
          href="/login"
          className="mt-4 inline-flex h-11 shrink-0 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-brand-dark transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:mt-0"
        >
          Entrar con Google
        </Link>
      </section>
    </PublicShell>
  );
}
