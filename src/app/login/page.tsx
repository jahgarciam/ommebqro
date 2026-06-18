import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getSiteUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  return siteUrl;
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
      redirect("/login?error=google");
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
          <button
            type="submit"
            className="w-full rounded-2xl bg-[#1F2E67] px-5 py-4 font-semibold text-white transition hover:opacity-90"
          >
            Continuar con Google
          </button>
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