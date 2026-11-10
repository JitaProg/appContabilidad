import type { Metadata } from "next";
import Link from "next/link";
import {
  LEGAL_CONTACT_EMAIL,
  PublicList,
  PublicSection,
  PublicShell,
} from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Qué datos recoge Tiquet, para qué se usan, dónde se guardan y cómo puedes acceder a ellos, exportarlos o eliminarlos.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PublicShell
      title="Política de privacidad"
      intro="En Tiquet tratamos los datos mínimos necesarios para que puedas registrar tus tickets y volver a consultarlos. Aquí explicamos qué recogemos, para qué y cómo puedes controlarlo."
      updated="10 de noviembre de 2026"
    >
      <PublicSection title="1. Responsable del tratamiento">
        <p>
          Tiquet es un proyecto personal de desarrollo de software. Para
          cualquier cuestión relacionada con la privacidad puedes escribir a{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="font-semibold text-brand underline-offset-2 hover:underline"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      </PublicSection>

      <PublicSection title="2. Qué datos tratamos">
        <PublicList
          items={[
            <>
              <strong className="font-semibold text-ink">Datos de la cuenta:</strong>{" "}
              nombre, dirección de correo electrónico y foto de perfil que Google
              comparte al iniciar sesión, además del identificador interno de tu
              cuenta en Supabase.
            </>,
            <>
              <strong className="font-semibold text-ink">Tickets:</strong> la foto
              del ticket, el importe final, el comercio, la fecha de compra y las
              fechas de creación y modificación del registro.
            </>,
            <>
              <strong className="font-semibold text-ink">Datos técnicos:</strong>{" "}
              cookies de sesión y registros de acceso (dirección IP, navegador y
              fecha) generados por los proveedores de alojamiento para mantener la
              seguridad y diagnosticar fallos.
            </>,
          ]}
        />
        <p>
          No pedimos teléfono, dirección postal, datos de pago ni documentos de
          identidad. No usamos los datos para publicidad ni para elaborar perfiles
          comerciales.
        </p>
      </PublicSection>

      <PublicSection title="3. Para qué usamos los datos">
        <PublicList
          items={[
            "Identificarte y mantener tu sesión iniciada.",
            "Guardar, mostrar, editar y eliminar los tickets y las fotos que tú creas.",
            "Calcular los totales y estadísticas que aparecen en la app.",
            "Generar copias de seguridad cuando tú lo solicitas.",
            "Proteger el servicio, prevenir abusos y resolver incidencias técnicas.",
          ]}
        />
        <p>
          La base jurídica es la ejecución de la relación de uso del servicio
          (art. 6.1.b RGPD) y, para la seguridad y el mantenimiento, nuestro interés
          legítimo en proteger la aplicación (art. 6.1.f RGPD). No tratamos datos
          para finalidades incompatibles con estas.
        </p>
      </PublicSection>

      <PublicSection title="4. Dónde se guardan y cuánto tiempo">
        <p>
          Los tickets y las fotos se almacenan en Supabase, con la base de datos y
          el almacenamiento configurados en la región <strong>eu-west-1</strong>{" "}
          (Irlanda). Las fotos están en un bucket privado y solo se muestran
          mediante enlaces firmados temporales.
        </p>
        <p>
          Conservamos los datos mientras tu cuenta exista y no los borres. Si
          eliminas un ticket, se borran también sus fotos. Si borras todos los
          datos desde Ajustes, se eliminan los tickets y las imágenes de tu
          espacio. Los registros técnicos de los proveedores pueden conservarse
          durante un periodo limitado por motivos de seguridad.
        </p>
      </PublicSection>

      <PublicSection title="5. Con quién compartimos los datos">
        <p>
          No vendemos ni alquilamos tus datos. Solo los comparten los proveedores
          necesarios para que la app funcione:
        </p>
        <PublicList
          items={[
            <>
              <strong className="font-semibold text-ink">Google</strong> para el
              inicio de sesión mediante OAuth. Google trata tus credenciales según
              su propia política.
            </>,
            <>
              <strong className="font-semibold text-ink">Supabase</strong> como
              proveedor de base de datos, autenticación y almacenamiento.
            </>,
            <>
              <strong className="font-semibold text-ink">Vercel</strong> como
              proveedor de alojamiento del sitio web.
            </>,
          ]}
        />
        <p>
          Estos proveedores pueden tratar datos fuera del Espacio Económico
          Europeo. En ese caso aplican las garantías previstas en el RGPD, como
          las cláusulas contractuales tipo de la Comisión Europea.
        </p>
      </PublicSection>

      <PublicSection title="6. Cookies">
        <p>
          Tiquet solo usa cookies técnicas necesarias para mantener tu sesión
          iniciada y proteger el acceso. No utiliza cookies publicitarias,
          analíticas ni de seguimiento de terceros. Puedes borrarlas desde la
          configuración del navegador, aunque al hacerlo se cerrará tu sesión.
        </p>
      </PublicSection>

      <PublicSection title="7. Tus derechos">
        <p>
          Puedes ejercer los derechos de acceso, rectificación, supresión,
          limitación, portabilidad y oposición escribiendo a{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="font-semibold text-brand underline-offset-2 hover:underline"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          . Muchos de ellos puedes ejercerlos directamente en la app:
        </p>
        <PublicList
          items={[
            "Descargar una copia de todos tus tickets y fotos desde Ajustes.",
            "Editar o eliminar cualquier ticket desde su detalle.",
            "Borrar todos tus datos desde Ajustes → Zona peligrosa.",
          ]}
        />
        <p>
          Si consideras que no hemos atendido correctamente tu solicitud, puedes
          reclamar ante la Agencia Española de Protección de Datos (AEPD),{" "}
          <a
            href="https://www.aepd.es"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-brand underline-offset-2 hover:underline"
          >
            www.aepd.es
          </a>
          .
        </p>
      </PublicSection>

      <PublicSection title="8. Seguridad">
        <p>
          Aplicamos medidas técnicas y organizativas razonables: conexiones HTTPS,
          autenticación mediante Google, reglas de seguridad por fila (RLS) para
          que cada cuenta solo acceda a sus tickets y un bucket privado para las
          fotos. Ningún sistema es infalible, pero revisamos la configuración y las
          dependencias con regularidad.
        </p>
      </PublicSection>

      <PublicSection title="9. Menores">
        <p>
          Tiquet no está dirigida a menores de 14 años. Si detectamos una cuenta
          creada por un menor sin la autorización correspondiente, la eliminaremos
          junto con sus datos.
        </p>
      </PublicSection>

      <PublicSection title="10. Cambios en esta política">
        <p>
          Podemos actualizar esta política para reflejar cambios en la app o en la
          normativa. Publicaremos la versión vigente en esta misma página e
          indicaremos la fecha de la última actualización. Si el cambio es
          relevante, avisaremos dentro de la app.
        </p>
      </PublicSection>

      <PublicSection title="11. Contacto">
        <p>
          Para cualquier duda sobre privacidad, escribe a{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="font-semibold text-brand underline-offset-2 hover:underline"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          . También puedes consultar los{" "}
          <Link
            href="/terms"
            className="font-semibold text-brand underline-offset-2 hover:underline"
          >
            términos de uso
          </Link>
          .
        </p>
      </PublicSection>
    </PublicShell>
  );
}
