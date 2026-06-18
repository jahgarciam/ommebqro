import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5]">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-10">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
            OMMEB Querétaro · Patrocinado por IQmat
          </p>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
            Plataforma de entrenamiento olímpico
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Estudia álgebra, combinatoria, geometría y teoría de números con
            rutas sugeridas por nivel, videos de entrenadores, lecturas,
            cuestionarios y ejercicios propuestos.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="rounded-2xl bg-[#1F2E67] px-6 py-3 text-center font-semibold text-white transition hover:opacity-90"
            >
              Entrar con Google
            </Link>

            <Link
              href="/privacidad"
              className="rounded-2xl border border-slate-300 px-6 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Aviso de privacidad
            </Link>
          </div>

          <AdSlot placement="landing-bottom" />
        </div>
      </section>
    </main>
  );
}