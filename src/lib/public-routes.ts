/**
 * Rutas que se pueden abrir sin sesión.
 *
 * `/login` y `/auth/*` son parte del flujo de acceso. Las páginas
 * informativas existen para poder publicar la app en Google y para que
 * cualquier persona pueda leer las condiciones antes de registrarse.
 */
const PUBLIC_PATHS = new Set(["/login", "/about", "/privacy", "/terms"]);

/**
 * Páginas informativas que se renderizan sin providers, sin splash y sin
 * sesión. Su HTML debe ser legible aunque el navegador no ejecute JavaScript.
 */
const STATIC_PUBLIC_PATHS = new Set(["/about", "/privacy", "/terms"]);

export function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.has(pathname) || pathname === "/auth" || pathname.startsWith("/auth/")
  );
}

export function isStaticPublicPath(pathname: string) {
  return STATIC_PUBLIC_PATHS.has(pathname);
}
