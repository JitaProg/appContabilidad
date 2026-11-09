# Tiquet

**Demo:** <https://tiquet-two.vercel.app>

**Tiquet** es una web app instalable (PWA) para llevar el gasto de tus tickets de forma
sencilla: haces una foto, apuntas el importe final, el comercio y la fecha, y consultas
cuánto has gastado cada mes. Todo se guarda localmente en el navegador: sin cuentas, sin
servidores y sin enviar fotos a terceros.

## Funciones

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
- **PWA instalable** y funcionamiento sin conexión después de la primera visita.
- Interfaz en español, importes en euros y diseño mobile-first.

## Cómo funciona

1. Eliges una foto del ticket con la cámara o la galería.
2. La imagen se comprime y se orienta en el propio dispositivo; también se genera una
   miniatura para los listados.
3. Introduces el importe final y el comercio. La fecha es opcional: si la dejas vacía se
   guarda la fecha de hoy.
4. El ticket aparece en el listado y en las estadísticas del mes correspondiente.

No hay reconocimiento de texto ni artículos: el ticket es la foto más los tres datos que
tú escribes. Así el registro es rápido y los totales siempre coinciden con lo que pagaste.

## Tecnología

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- React 19 + TypeScript
- Tailwind CSS v4
- [Dexie 4](https://dexie.org/) sobre IndexedDB para los datos locales
- [Recharts](https://recharts.org/) para las gráficas
- [JSZip](https://stuk.github.io/jszip/) para las copias ZIP
- Service worker propio para el modo offline

## Desarrollo local

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>.

### Scripts

```bash
npm run dev         # servidor de desarrollo
npm run build       # build de producción
npm run start       # sirve el build
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm test            # tests de importes y fechas (Vitest)
```

Los tests no necesitan navegador: cubren el formato de fechas y la conversión de importes
a céntimos.

## Despliegue en Vercel

La app no necesita variables de entorno ni base de datos remota. Es estática y toda la
lógica corre en el cliente.

1. Sube el repositorio a GitHub.
2. En [Vercel](https://vercel.com/new), importa el repositorio.
3. Vercel detecta Next.js automáticamente. Deja los valores por defecto y pulsa **Deploy**.

También puedes desplegar desde la CLI:

```bash
npx vercel
```

> El service worker solo se registra en producción (`NODE_ENV=production`), así que para
> probar la instalación PWA y el modo offline usa `npm run build && npm run start` o la
> URL de Vercel.

## Privacidad y almacenamiento

- Los tickets, las fotos y las miniaturas viven en **IndexedDB**, en el almacenamiento del
  navegador de tu dispositivo.
- No hay backend, login, analítica ni cookies de seguimiento.
- Las imágenes no se envían a ningún servicio externo ni se procesan con OCR.
- Si borras los datos del navegador o desinstalas la PWA, se pierden los tickets. Descarga
  una copia ZIP desde **Ajustes** antes de cambiar de dispositivo.

## Estructura

```
src/
  app/                 Rutas (dashboard, tickets, estadísticas, ajustes)
  components/          UI, formulario, gráficas, navegación y providers
  lib/
    db.ts              Esquema Dexie y operaciones CRUD
    image.ts           Compresión y miniaturas en canvas
    backup.ts          Exportación CSV/ZIP e importación
    stats.ts           Agregados mensuales
    dates.ts           Utilidades de fechas y meses
public/
  icons/               Iconos PWA
  sw.js                Service worker (app shell + offline)
```

## Limitaciones conocidas

- Las fotos HEIC pueden no abrirse en navegadores que no sean Safari.
- Los navegadores pueden borrar el almacenamiento local si el dispositivo se queda sin
  espacio. Las copias de seguridad son la red de seguridad.
- El detalle de un ticket necesita haber visitado antes esa ruta (o la lista) para estar
  disponible sin conexión; el resto de la app se precarga al instalar el service worker.
- Al actualizar desde una versión anterior se conservan los tickets, pero se descartan los
  artículos, categorías y datos de OCR antiguos.

## Licencia

Uso personal. Añade la licencia que prefieras antes de publicar el repositorio.
