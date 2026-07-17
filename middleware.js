import { NextResponse } from "next/server";

export function middleware(request) {
  const userAgent = request.headers.get("user-agent") || "";
  

  const isBot =
    /bot|crawler|spider|facebookexternalhit|facebot|twitterbot|bingbot|googlebot|claudebot|gptbot|applebot|slackbot|discordbot|linkedinbot/i.test(
      userAgent
    );

  console.log({
    type: isBot ? "BOT" : "POSSIBLE HUMAN",
    city: request.headers.get("x-vercel-ip-city"),
    region: request.headers.get("x-vercel-ip-country-region"),
    country: request.headers.get("x-vercel-ip-country"),
    path: request.nextUrl.pathname,
    userAgent,
  });

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};