import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname !== "/" && pathname.endsWith("/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url, 301);
  }

  if (pathname === "/horeca/ogoloshennya" && searchParams.has("city")) {
    const city = searchParams.get("city")?.trim();
    if (city) {
      return NextResponse.redirect(
        new URL(`/horeca/${city}/ogoloshennya`, request.url),
        301,
      );
    }
  }

  if (pathname === "/horeca/prodazh" && searchParams.has("city")) {
    const city = searchParams.get("city")?.trim();
    if (city) {
      return NextResponse.redirect(
        new URL(`/horeca/${city}/prodazh`, request.url),
        301,
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.png|manifest.webmanifest).*)"],
};
