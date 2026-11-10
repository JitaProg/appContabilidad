import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isPublicPath, isStaticPublicPath } from "@/lib/public-routes";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\"))
    return "/";
  return value;
}

function redirectWithCookies(url: URL, source: NextResponse) {
  const response = NextResponse.redirect(url);
  source.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  let response = NextResponse.next({ request });

  // Las páginas informativas no dependen de Supabase ni de la sesión: se
  // sirven directamente para que estén disponibles aunque el auth falle.
  if (isStaticPublicPath(pathname)) return response;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sin configuración, la app muestra una pantalla de ayuda en el cliente.
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresca la sesión y valida el usuario contra Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = isPublicPath(pathname);

  if (!user && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    const next = `${pathname}${request.nextUrl.search}`;
    if (next !== "/") loginUrl.searchParams.set("next", next);
    return redirectWithCookies(loginUrl, response);
  }

  if (user && pathname === "/login") {
    const next = safeNextPath(searchParams.get("next"));
    return redirectWithCookies(new URL(next, request.url), response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|sw.js|robots.txt|sitemap.xml|.*\\.(?:png|jpe?g|webp|svg|ico)$).*)",
  ],
};
