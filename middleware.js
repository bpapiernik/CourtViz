import { NextResponse } from "next/server";

export function middleware(request) {
  console.log({
    city: request.headers.get("x-vercel-ip-city"),
    region: request.headers.get("x-vercel-ip-country-region"),
    country: request.headers.get("x-vercel-ip-country"),
    path: request.nextUrl.pathname,
  });

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};