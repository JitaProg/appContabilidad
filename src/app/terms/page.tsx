import type { Metadata } from "next";
import Link from "next/link";
import {
  LEGAL_CONTACT_EMAIL,
  PublicList,
  PublicSection,
  PublicShell,
} from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Términos de uso",
  description:
    "Condiciones de uso de Tiquet: cuenta de Google, contenido, uso aceptable, disponibilidad y responsabilidad.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PublicShell
      title="Términos de uso"
      intro="Estas condiciones explican cómo puedes usar Tiquet y qué puedes esperar del servicio. Al entrar en la app aceptas estos términos y la política de privacidad."
      updated="10 de noviembre de 2026"
    >
      <PublicSection title="1. Objeto del servicio">
        <p>
          Tiquet es una aplicación web para registrar y consultar gastos
          personales a partir de fotos de tickets. La app permite guardar el
          importe final, el comercio, la fecha y una imagen, calcular estadísticas
          y exportar copias de tus datos.
        </p>
        <p>
          El servicio se ofrece como proyecto personal, de forma gratuita y sin
          garantía de disponibilidad continua. No sustituye a un asesor fiscal,
          contable o financiero.
        </p>
      </PublicSection>

      <PublicSection title="2. Tu cuenta">
        <PublicList
          items={[
            "Para usar Tiquet necesitas iniciar sesión con una cuenta de Google.",
            "Debes ser mayor de 14 años y tener capacidad para aceptar estos términos.",
            "La cuenta es personal. No compartas tu sesión ni uses la de otra persona.",
            "Eres responsable de la actividad realizada desde tu cuenta y de mantener el acceso a tu correo de Google seguro.",
          ]}
        />
        <p>
          Si detectas un uso no autorizado de tu cuenta, escríbenos lo antes
          posible a{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="font-semibold text-brand underline-offset-2 hover:underline"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      </PublicSection>

      <PublicSection title="3. Uso aceptable">
        <p>Al usar Tiquet te comprometes a no:</p>
        <PublicList
          items={[
            "Subir contenido ilegal, ofensivo o que vulnere derechos de terceros.",
            "Intentar acceder a tickets, fotos o cuentas de otras personas.",
            "Sobrecargar, automatizar abusivamente o interferir en el funcionamiento del servicio.",
            "Realizar ingeniería inversa, copiar o redistribuir la app sin autorización.",
            "Usar la app para fines distintos de la gestión de tus propios gastos personales.",
          ]}
        />
        <p>
          Podemos suspender el acceso si detectamos un uso que ponga en riesgo el
          servicio, a otros usuarios o a terceros.
        </p>
      </PublicSection>

      <PublicSection title="4. Tu contenido">
        <p>
          Los tickets, las fotos y los datos que registras siguen siendo tuyos. Nos
          concedes únicamente el permiso necesario para almacenarlos, procesarlos y
          mostrártelos dentro de la app, incluida la generación de miniaturas y
          enlaces temporales.
        </p>
        <p>
          Eres responsable de contar con permiso para subir las imágenes que
          guardes. No reclamamos la propiedad de tu contenido ni lo usamos para
          otros fines.
        </p>
      </PublicSection>

      <PublicSection title="5. Disponibilidad y cambios">
        <p>
          Intentamos mantener la app disponible y corregir los fallos cuanto antes,
          pero no podemos garantizar un servicio ininterrumpido. Podemos realizar
          tareas de mantenimiento, cambiar funciones o dejar de ofrecer el servicio
          por motivos técnicos, económicos o legales.
        </p>
        <p>
          Si vamos a cerrar el servicio de forma definitiva, avisaremos con
          antelación razonable para que puedas exportar tus datos desde Ajustes.
        </p>
      </PublicSection>

      <PublicSection title="6. Copias de seguridad">
        <p>
          Aunque los datos se guardan en Supabase, ningún sistema está libre de
          fallos. Te recomendamos descargar una copia periódica en ZIP desde
          Ajustes si quieres conservar tus tickets a largo plazo.
        </p>
      </PublicSection>

      <PublicSection title="7. Responsabilidad">
        <p>
          En la medida permitida por la ley, Tiquet no responde de daños indirectos,
          pérdida de datos, lucro cesante o decisiones tomadas a partir de las
          cifras mostradas. La app es una herramienta de apoyo y los importes
          dependen de los datos que introduces.
        </p>
        <p>
          Nada en estos términos limita los derechos que la normativa de consumo o
          de protección de datos te reconoce como usuario.
        </p>
      </PublicSection>

      <PublicSection title="8. Propiedad intelectual">
        <p>
          El nombre Tiquet, el logotipo, el diseño y el código de la aplicación
          pertenecen a su desarrollador. Estos términos no te ceden ningún derecho
          sobre ellos, salvo el uso personal y no exclusivo del servicio.
        </p>
      </PublicSection>

      <PublicSection title="9. Privacidad">
        <p>
          El tratamiento de tus datos personales se explica en la{" "}
          <Link
            href="/privacy"
            className="font-semibold text-brand underline-offset-2 hover:underline"
          >
            política de privacidad
          </Link>
          , que forma parte de estos términos.
        </p>
      </PublicSection>

      <PublicSection title="10. Cambios y nulidad">
        <p>
          Podemos actualizar estos términos para reflejar cambios en la app o en la
          normativa. La versión vigente estará siempre publicada en esta página con
          su fecha de actualización. Si alguna cláusula resultara nula, el resto
          seguirá siendo válido.
        </p>
      </PublicSection>

      <PublicSection title="11. Ley aplicable y contacto">
        <p>
          Estas condiciones se rigen por la legislación española. Si actúas como
          consumidor, cualquier controversia se someterá a los juzgados de tu
          domicilio. Para cualquier consulta, escribe a{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="font-semibold text-brand underline-offset-2 hover:underline"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      </PublicSection>
    </PublicShell>
  );
}
