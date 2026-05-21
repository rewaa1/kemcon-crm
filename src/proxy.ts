import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Derive the locale from the path (e.g. /en/... or /ar/...)
  const segments = pathname.split("/");
  const locale = routing.locales.includes(segments[1] as "en" | "ar")
    ? segments[1]
    : routing.defaultLocale;

  const isAuthRoute =
    pathname.includes("/login");

  // Run next-intl locale handling first
  const intlResponse = intlMiddleware(request);

  // If next-intl already issued a redirect (e.g. / → /en), respect it
  if (intlResponse.status === 307 || intlResponse.status === 308 || intlResponse.status === 302 || intlResponse.status === 301) {
    return intlResponse;
  }

  // Auth check via Supabase
  let supabaseResponse = intlResponse ?? NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          // Preserve next-intl locale headers that would otherwise be lost
          intlResponse.headers.forEach((value, key) => {
            supabaseResponse.headers.set(key, value);
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

