"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function signInWithGoogle() {
    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMessage("No se pudo iniciar sesión con Google.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F5F5] px-6 py-10">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
          Plataforma OMMEB · IQmat
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          Entrar a la plataforma
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Para proteger el acceso y evitar cuentas duplicadas, el inicio de
          sesión se realiza exclusivamente con Google.
        </p>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-[#1F2E67] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Conectando..." : "Continuar con Google"}
        </button>

        {errorMessage ? (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <p className="mt-5 text-xs leading-5 text-slate-500">
          Al continuar aceptas el uso de la plataforma conforme al{" "}
          <Link href="/privacidad" className="font-semibold text-[#1F2E67]">
            aviso de privacidad
          </Link>
          .
        </p>
      </section>
    </main>
  );
}