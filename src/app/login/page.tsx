import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

function getSiteUrl() {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  if (
    configuredUrl &&
    configuredUrl.startsWith("https://ommebqro.netlify.app") &&
    !configuredUrl.includes("--ommebqro.netlify.app")
  ) {
    return configuredUrl;
  }

  return "https://ommebqro.netlify.app";
}

export default async function LoginPage() {
  async function signInWithGoogle() {
    "use server";

    const supabase = await createClient();
    const siteUrl = getSiteUrl();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error || !data.url) {
      redirect(`${siteUrl}/login?error=google`);
    }

    redirect(data.url);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F5F5] px-6 py-12">
      <section className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
          Plataforma OMMEB · IQmat
        </p>

        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          Entrar a la plataforma
        </h1>

        <p className="mt-4 leading-7 text-slate-600">
          Para proteger el acceso y evitar cuentas duplicadas, el inicio de
          sesión se realiza exclusivamente con Google.
        </p>

        <form action={signInWithGoogle} className="mt-8">
          <GoogleLoginButton />
        </form>

        <p className="mt-6 text-sm leading-6 text-slate-500">
          Al continuar aceptas el uso de la plataforma conforme al{" "}
          <Link
            href="/privacidad"
            className="font-semibold text-[#1F2E67] hover:underline"
          >
            aviso de privacidad
          </Link>
          .
        </p>
      </section>
    </main>
  );
}