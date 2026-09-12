import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth) {
    const signInUrl = new URL("/signin", req.nextUrl.origin);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/vote/:path*", "/compare/:path*", "/rank/:path*", "/admin/:path*"],
};
