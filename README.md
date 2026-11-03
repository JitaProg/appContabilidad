# Tiquet

**Tiquet** es una web app instalable (PWA) para digitalizar tickets de compra con OCR
en el propio dispositivo, clasificar el gasto por categorías y consultar cuánto has
gastado cada mes. Todo se guarda localmente en el navegador: sin cuentas, sin servidores
y sin enviar fotos a terceros.

## Funciones

- **Escanear tickets** con la cámara o desde la galería.
- **OCR en el dispositivo** con Tesseract.js (español). Sin subir imágenes a ningún servicio.
- **Detección automática** de comercio, fecha, total, NIF/CIF, artículos e IVA con reglas
  pensadas para tickets españoles.
- **Pantalla de revisión obligatoria** antes de guardar: el OCR se equivoca y siempre
  puedes corregir los datos.
- **Alta manual** de tickets cuando no quieras o no puedas usar la cámara.
- **Categorías** de gasto (supermercado, restaurantes, gasolina, transporte, hogar, salud,
  ocio, compras, suscripciones y otros) con autodetección por comercio.
- **Totales mensuales**, media diaria, media por ticket, comparación con el mes anterior,
  gráfica de los últimos 12 meses, ranking de categorías y comercios.
- **Búsqueda y filtros** por comercio, nota, categoría o NIF.
- **Copia de seguridad** en ZIP (datos + fotos + artículos), exportación a CSV para Excel
  y restauración desde ZIP o JSON.
- **PWA instalable** y funcionamiento sin conexión después de la primera visita.
- Interfaz en español, importes en euros y diseño mobile-first.

## Cómo funciona el OCR

1. La foto se procesa en un `<canvas>`: se corrige la orientación, se limita el tamaño y
   se genera una versión en escala de grises con más contraste para el OCR.
2. Tesseract.js carga el motor desde jsDelivr y el diccionario español desde
   `/tessdata/spa.traineddata.gz` (autoalojado). La primera vez descarga unos 6 MB; después
   queda en caché y funciona sin conexión.
3. Un parser basado en reglas busca el total (evitando cambio, tarjeta, subtotales o IVA),
   la fecha, el comercio, el NIF y los artículos.
4. Los campos dudosos se marcan en ámbar en el formulario de revisión.

La app **no promete OCR perfecto**. Los tickets arrugados, con poca luz o con fuentes
raras pueden leerse mal; por eso el flujo siempre pasa por revisión humana.

## Tecnología

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- React 19 + TypeScript
- Tailwind CSS v4
- [Tesseract.js 7](https://github.com/naptha/tesseract.js) para OCR en el navegador
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
npm test            # tests del parser y de importes (Vitest)
```

Los tests no necesitan navegador: cubren el parser de tickets, el formato de fechas y la
conversión de importes a céntimos.

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

- Los tickets, fotos y ajustes viven en **IndexedDB**, en el almacenamiento del navegador
  de tu dispositivo.
- No hay backend, login, analítica ni cookies de seguimiento.
- El OCR se ejecuta en el dispositivo. La única descarga externa es el motor de
  Tesseract.js desde jsDelivr; las imágenes nunca se envían.
- Si borras los datos del navegador o desinstalas la PWA, se pierden los tickets. Descarga
  una copia ZIP desde **Ajustes** antes de cambiar de dispositivo.

## Estructura

```
src/
  app/                 Rutas (dashboard, tickets, escanear, estadísticas, ajustes)
  components/          UI, formulario, gráficas, navegación y providers
  lib/
    db.ts              Esquema Dexie y operaciones CRUD
    parser/            Parser de tickets españoles y tests
    ocr.ts             Worker de Tesseract.js
    image.ts           Preprocesado de imagen en canvas
    backup.ts          Exportación CSV/ZIP e importación
    stats.ts           Agregados mensuales
public/
  icons/               Iconos PWA
  sw.js                Service worker (app shell + offline)
  tessdata/            Diccionario español de Tesseract
```

## Limitaciones conocidas

- El OCR depende de la calidad de la foto y del ticket. Revisa siempre los campos.
- Las fotos HEIC pueden no abrirse en navegadores que no sean Safari.
- Los navegadores pueden borrar el almacenamiento local si el dispositivo se queda sin
  espacio. Las copias de seguridad son la red de seguridad.
- El detalle de un ticket necesita haber visitado antes esa ruta (o la lista) para estar
  disponible sin conexión; el resto de la app se precarga al instalar el service worker.

## Licencia

Uso personal. Añade la licencia que prefieras antes de publicar el repositorio.
