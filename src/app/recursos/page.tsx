import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Recursos | OMMEB Querétaro · IQmat",
  description:
    "Recursos de introducción para el entrenamiento olímpico en álgebra, combinatoria, geometría y teoría de números.",
};

const resources = [
  {
    title: "Álgebra",
    href: "/recursos/algebra",
    description:
      "Patrones, expresiones, ecuaciones, relaciones numéricas y estrategias para representar problemas.",
  },
  {
    title: "Combinatoria",
    href: "/recursos/combinatoria",
    description:
      "Conteo organizado, casos posibles, principio multiplicativo y formas de evitar contar de más.",
  },
  {
    title: "Geometría",
    href: "/recursos/geometria",
    description:
      "Figuras, ángulos, áreas, semejanza, visualización y argumentos geométricos.",
  },
  {
    title: "Teoría de números",
    href: "/recursos/teoria-de-numeros",
    description:
      "Divisibilidad, múltiplos, factores, residuos, paridad y propiedades de los números enteros.",
  },
];

export default function RecursosPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-5xl">
        <header className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/logos/logoOMMEB.png"
                alt="Logo OMMEB Querétaro"
                width={120}
                height={70}
                className="h-auto w-32 object-contain"
                priority
              />

              <Image
                src="/logos/IQmat.jpg"
                alt="Logo IQmat"
                width={80}
                height={80}
                className="h-16 w-16 rounded-2xl object-contain"
                priority
              />
            </div>

            <nav className="flex flex-wrap gap-3 text-sm font-semibold">
              <Link
                href="/acerca"
                className="rounded-2xl border border-slate-300 px-4 py-2 text-slate-700 transition hover:bg-slate-50"
              >
                Inicio
              </Link>

              <Link
                href="/privacidad"
                className="rounded-2xl border border-slate-300 px-4 py-2 text-slate-700 transition hover:bg-slate-50"
              >
                Privacidad
              </Link>

              <Link
                href="/login"
                className="rounded-2xl bg-[#1F2E67] px-4 py-2 text-white transition hover:opacity-90"
              >
                Entrar
              </Link>
            </nav>
          </div>

          <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
            Recursos
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Ideas base para entrenar matemáticas olímpicas
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
            Esta sección reúne explicaciones introductorias abiertas para
            estudiantes, familias y docentes interesados en comprender qué se
            estudia en el entrenamiento olímpico de matemáticas.
          </p>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
            Estos recursos no sustituyen la plataforma completa, pero
            permiten conocer el tipo de razonamiento que se busca desarrollar:
            observar patrones, justificar procedimientos, organizar casos y
            construir argumentos.
          </p>
        </header>

        <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {resources.map((resource) => (
            <article
              key={resource.href}
              className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <h2 className="text-2xl font-bold text-slate-950">
                {resource.title}
              </h2>

              <p className="mt-4 leading-7 text-slate-700">
                {resource.description}
              </p>

              <Link
                href={resource.href}
                className="mt-6 inline-flex rounded-2xl bg-[#1F2E67] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Leer recurso
              </Link>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/acerca"
              className="inline-flex justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver al inicio
            </Link>

            <Link
              href="/login"
              className="inline-flex justify-center rounded-2xl bg-[#1F2E67] px-5 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Entrar a la plataforma
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}