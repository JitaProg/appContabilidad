# Tiquet

**Demo:** <https://tiquet-two.vercel.app>

**Tiquet** es una web app instalable (PWA) para llevar el gasto de tus tickets de forma
sencilla: haces una foto, apuntas el importe final, el comercio y la fecha, y consultas
cuánto has gastado cada mes. Los tickets y las fotos se guardan en **Supabase**, aislados
por cuenta y protegidos con RLS. El acceso es únicamente con **Google**.

## Funciones

- **Inicio de sesión con Google**. Cada cuenta ve solo sus propios tickets.
- **Foto del ticket** con la cámara o desde la galería.
- **Datos mínimos**: importe final, comercio y fecha. Si no indicas fecha, se usa la del
  día en que registras el ticket.
- **Edición y borrado** de cualquier ticket guardado.
- **Totales mensuales**, media diaria, media por ticket, ticket más alto, número de
  comercios, comparación con el mes anterior, gráfica de los últimos 12 meses y ranking de
  comercios.
- **Búsqueda por comercio** y filtro por mes.
- **Copia de seguridad** en ZIP (datos + fotos), exportación a CSV para Excel y
  restauración desde ZIP o JSON.
- **PWA instalable**, interfaz en español e importes en euros.

## Cómo funciona

1. Entras con tu cuenta de Google.
2. Eliges una foto del ticket con la cámara o la galería.
3. La imagen se comprime y se orienta en el propio dispositivo; también se genera una
   miniatura para los listados.
4. La foto se sube a un bucket privado de Supabase y el ticket se guarda en la tabla
   `public.receipts`, asociado a tu `auth.uid()`.
5. El ticket aparece en el listado y en las estadísticas del mes correspondiente.

Las fotos se muestran mediante **URLs firmadas temporales**. No hay reconocimiento de texto
ni artículos: el ticket es la foto más los tres datos que tú escribes.

## Tecnología

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- React 19 + TypeScript
- Tailwind CSS v4
- [Supabase](https://supabase.com/) (`@supabase/supabase-js` + `@supabase/ssr`)
- [Recharts](https://recharts.org/) para las gráficas
- [JSZip](https://stuk.github.io/jszip/) para las copias ZIP
- Service worker propio para instalar la PWA

## Configuración de Supabase

El proyecto ya está creado en la región `eu-west-1`:

- **Project ref:** `tekpznxyrykcqosppwet`
- **URL:** `https://tekpznxyrykcqosppwet.supabase.co`
- **Dashboard:** <https://supabase.com/dashboard/project/tekpznxyrykcqosppwet>

La migración [`supabase/migrations/20261109194000_cloud_receipts.sql`](./supabase/migrations/20261109194000_cloud_receipts.sql)
crea:

- `public.receipts` con `user_id`, fecha, comercio, importe y rutas de las fotos.
- Índice `(user_id, purchase_date desc, created_at desc)`.
- RLS activo: `select`, `insert`, `update` y `delete` solo para el dueño.
- Bucket privado `receipts` con políticas de Storage por carpeta `${user_id}/`.

### Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores de
**Project Settings → API**:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tekpznxyrykcqosppwet.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

La clave publicable es segura para el navegador: los permisos reales los aplica RLS.

## Configurar el login con Google

### 1. Crear las credenciales en Google Cloud

1. Abre <https://console.cloud.google.com/apis/credentials> y crea (o elige) un proyecto.
2. Configura la pantalla de consentimiento en **Google Auth Platform → Branding**:
   nombre de la app `Tiquet`, correo de asistencia y correo del desarrollador. Tipo
   **External**. No necesitas scopes sensibles: bastan `openid`, `email` y `profile`.
3. Ve a **Credentials → Create credentials → OAuth client ID → Web application**.
4. En **Authorized JavaScript origins** añade:
   - `http://localhost:3000`
   - `https://tiquet-two.vercel.app`
5. En **Authorized redirect URIs** añade exactamente:
   - `https://tekpznxyrykcqosppwet.supabase.co/auth/v1/callback`
6. Guarda el **Client ID** y el **Client Secret**.

### 2. Activar Google en Supabase

1. Abre <https://supabase.com/dashboard/project/tekpznxyrykcqosppwet/auth/providers>.
2. En **Sign In / Providers**, activa **Google**.
3. Pega el Client ID y el Client Secret de Google Cloud y guarda.

### 3. Configurar las URLs de autenticación

En <https://supabase.com/dashboard/project/tekpznxyrykcqosppwet/auth/url-configuration>:

- **Site URL:** `https://tiquet-two.vercel.app`
- **Redirect URLs:**
  - `http://localhost:3000/auth/callback**`
  - `https://tiquet-two.vercel.app/auth/callback**`

El `**` final permite que Supabase acepte el parámetro `?next=` que añade la app al
`redirectTo`. Si usas dominios de preview de Vercel, añade también el patrón
correspondiente (`https://*-<tu-equipo>.vercel.app/**`).

Mientras la app de Google esté en modo **Testing**, añade tu cuenta como usuario de
prueba en **Google Auth Platform → Audience → Test users** si vas a solicitar scopes
sensibles. Con los scopes básicos que usa Supabase (`openid`, `email` y `profile`) no
hace falta: Google exceptúa estos casos del límite de test users, del aviso de app no
verificada y de la caducidad de la autorización a los 7 días. Aun así, publicar la app
en **Audience → Publish app** es lo recomendable para dejarla disponible de forma
general.

El flujo completo es:

```
Google → https://<project-ref>.supabase.co/auth/v1/callback
       → https://tu-app/auth/callback (intercambia el código por cookies de sesión)
       → /
```

## Páginas públicas y publicación en Google

La app tiene tres páginas informativas accesibles sin sesión:

| Página | URL | Uso |
| --- | --- | --- |
| Sobre Tiquet | <https://tiquet-two.vercel.app/about> | Página principal de la app |
| Privacidad | <https://tiquet-two.vercel.app/privacy> | Política de privacidad |
| Términos | <https://tiquet-two.vercel.app/terms> | Términos de uso |

Estas rutas están en la allowlist de `src/proxy.ts` y viven fuera del grupo `(app)`,
así que no montan providers, splash ni sesión. Son componentes de servidor: el
contenido llega en el HTML aunque el navegador no ejecute JavaScript.

### Campos en Google Auth Platform → Branding

- **App name:** Tiquet
- **User support email:** `borjablp2@gmail.com`
- **App logo:** [`public/icons/icon-512.png`](./public/icons/icon-512.png) (512×512)
- **Application home page:** `https://tiquet-two.vercel.app/about`
- **Application privacy policy link:** `https://tiquet-two.vercel.app/privacy`
- **Application terms of service link:** `https://tiquet-two.vercel.app/terms`
- **Authorized domains:** `tiquet-two.vercel.app`
- **Developer contact email:** `borjablp2@gmail.com`

Orden recomendado: rellenar los campos de **Branding** → guardar → **Audience →
Publish app**. Si quieres que el nombre y el logo aparezcan en la pantalla de
consentimiento, hay que solicitar además la **verificación de marca**; sin ella Google
muestra solo el dominio del proyecto.

### ¿Hace falta publicar?

Funcionalmente no. Supabase solicita únicamente `openid`, `email` y `profile`, y Google
exceptúa las apps externas en estado *Testing* que solo piden esos scopes básicos: no
exige lista de test users, no muestra el aviso de app no verificada y la autorización no
caduca a los 7 días. Publicar elimina el estado *Testing* y deja la app disponible de
forma general, que es lo esperable para una app real.

## Seguridad y gestión de claves

- El frontend solo usa `NEXT_PUBLIC_SUPABASE_URL` y
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. La clave publishable está diseñada para el
  navegador; RLS y las políticas de Storage limitan cada usuario a sus propios datos.
- Nunca añadas `SUPABASE_SERVICE_ROLE_KEY`, `sb_secret_...`, el Client Secret de Google
  ni claves privadas a variables `NEXT_PUBLIC_*`, al código, a `opencode.json` o a la
  documentación.
- `.env.local` está ignorado por Git (`.env*` salvo `.env.example`) y `.vercel` también.
  No subas archivos `.env`, `.pem`, `.p12` ni credenciales de la CLI.
- En Vercel, configura las variables en **Settings → Environment Variables** para
  Production, Preview y Development. No las pegues en el repositorio.
- Si una clave secreta se expone, revócala en Supabase o Google Cloud, rota el valor y
  vuelve a desplegar.
- Auditoría realizada: sin claves secretas reales (`service_role`, `sb_secret_`,
  `GOCSPX`, `client_secret`, claves privadas) en el árbol de trabajo ni en el historial
  de Git. Los source maps del despliegue no son públicos.

## Desarrollo local

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>. Sin sesión te redirige a `/login`.

### Scripts

```bash
npm run dev         # servidor de desarrollo
npm run build       # build de producción
npm run start       # sirve el build
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm test            # tests de importes y fechas (Vitest)
```

## Despliegue en Vercel

1. Sube el repositorio a GitHub.
2. En [Vercel](https://vercel.com/new), importa el repositorio.
3. Añade las variables `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en **Settings → Environment Variables** para
   Production, Preview y Development.
4. Despliega.

Desde la CLI:

```bash
npx vercel
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npx vercel --prod
```

> El service worker solo se registra en producción (`NODE_ENV=production`). Para probar la
> instalación PWA usa `npm run build && npm run start` o la URL de Vercel.

## Privacidad y almacenamiento

- Los tickets viven en `public.receipts` de Supabase, siempre asociados a tu `user_id`.
- Las fotos viven en el bucket **privado** `receipts`, en la carpeta de tu usuario.
- La sesión se guarda en **cookies** gestionadas por `@supabase/ssr`, no en
  `localStorage`. La información de los tickets nunca se guarda en el navegador.
- Las fotos se muestran con URLs firmadas que caducan a las 24 horas.
- No hay analítica ni cookies de seguimiento.
- Puedes descargar una copia ZIP o borrar todos tus datos desde **Ajustes**.
- La política completa está en <https://tiquet-two.vercel.app/privacy> y los términos
  de uso en <https://tiquet-two.vercel.app/terms>.

## Estructura

```
src/
  app/
    (app)/             Rutas con sesión, providers y navegación inferior
      login/           Pantalla de acceso con Google
      receipts/        Listado, alta y detalle de tickets
      scan/            Acceso rápido a la cámara
      settings/        Cuenta, copias y borrado
      stats/           Estadísticas mensuales
    about/             Página pública de presentación
    auth/callback/     Intercambio del código OAuth por sesión
    privacy/           Política de privacidad
    terms/             Términos de uso
  components/          UI, formularios, providers, navegación y páginas públicas
  lib/
    supabase/          Cliente, servidor, configuración y CRUD
    image.ts           Compresión y miniaturas en canvas
    backup.ts          Exportación CSV/ZIP e importación
    public-routes.ts   Allowlist de rutas sin sesión
    stats.ts           Agregados mensuales
    dates.ts           Utilidades de fechas y meses
  proxy.ts             Refresco de sesión y protección de rutas
supabase/
  migrations/          Esquema SQL, RLS y bucket de Storage
public/
  icons/               Iconos PWA
  sw.js                Service worker (solo estáticos)
```

## Limitaciones conocidas

- La app necesita conexión para cargar y guardar tickets en Supabase.
- Las fotos HEIC pueden no abrirse en navegadores que no sean Safari.
- Las URLs firmadas de las fotos caducan a las 24 h; al recargar se generan de nuevo.
- Al restaurar una copia se añaden tickets a la cuenta actual; no se conservan los IDs
  originales.

## Licencia

Uso personal. Añade la licencia que prefieras antes de publicar el repositorio.
