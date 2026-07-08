import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export default async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  if (host.includes("--ommebqro.netlify.app")) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.hostname = "ommebqro.netlify.app";

    return NextResponse.redirect(url, 308);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Aplica proxy a todas las rutas excepto archivos estáticos.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};