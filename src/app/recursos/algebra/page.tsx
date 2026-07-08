import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Álgebra olímpica | Recursos OMMEB Querétaro · IQmat",
  description:
    "Introducción al álgebra en el entrenamiento olímpico de matemáticas para educación básica.",
};

export default function AlgebraResourcePage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <article className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-sm md:p-10">
        <header className="border-b border-slate-200 pb-6">
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
                href="/recursos"
                className="rounded-2xl border border-slate-300 px-4 py-2 text-slate-700 transition hover:bg-slate-50"
              >
                Recursos
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
            Recursos · Álgebra
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            ¿Qué se estudia en álgebra olímpica?
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-700">
            En el entrenamiento olímpico, el álgebra no se reduce a resolver
            ecuaciones. También ayuda a reconocer patrones, expresar relaciones,
            transformar información y construir argumentos generales.
          </p>
        </header>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-950">
            El álgebra como lenguaje de patrones
          </h2>

          <p className="leading-7">
            Muchos problemas olímpicos empiezan con una observación sencilla:
            una secuencia de números, una tabla, una operación repetida o una
            relación que parece cumplirse en varios casos. El álgebra permite
            escribir esa regularidad de forma más clara.
          </p>

          <p className="leading-7">
            Por ejemplo, si al estudiar una sucesión observamos que cada término
            aumenta en tres unidades, podemos describir el patrón con palabras,
            con una tabla o con una expresión algebraica. Cada representación
            ayuda a mirar el problema desde un ángulo distinto.
          </p>

          <div className="rounded-3xl bg-[#F7F2E7] p-5">
            <p className="font-semibold text-slate-950">Idea clave</p>
            <p className="mt-2 leading-7">
              En álgebra olímpica, una expresión no es solo una fórmula para
              sustituir números. Es una manera de representar una estructura y
              razonar sobre todos los casos posibles.
            </p>
          </div>
        </section>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-950">
            Ejemplo introductorio
          </h2>

          <p className="leading-7">
            Imagina que una figura se construye con puntos. La primera figura
            tiene 4 puntos, la segunda tiene 7, la tercera tiene 10 y la cuarta
            tiene 13. Antes de buscar una expresión, conviene preguntar:
          </p>

          <ul className="list-disc space-y-2 pl-6 leading-7">
            <li>¿Qué cambia de una figura a otra?</li>
            <li>¿Qué permanece igual?</li>
            <li>¿Cuánto aumenta cada vez?</li>
            <li>¿Cómo describiríamos la figura número 20 sin dibujar todas?</li>
          </ul>

          <p className="leading-7">
            La diferencia constante es 3. Eso sugiere que el número de puntos
            puede describirse como un valor inicial más varios aumentos de tres.
            Este tipo de razonamiento ayuda a pasar de casos particulares a una
            descripción general.
          </p>
        </section>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-950">
            Habilidades que se desarrollan
          </h2>

          <p className="leading-7">
            Trabajar álgebra en problemas olímpicos fortalece habilidades como:
          </p>

          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <li className="rounded-2xl border border-slate-200 p-4">
              Reconocer patrones numéricos.
            </li>
            <li className="rounded-2xl border border-slate-200 p-4">
              Traducir situaciones a expresiones.
            </li>
            <li className="rounded-2xl border border-slate-200 p-4">
              Comparar distintos procedimientos.
            </li>
            <li className="rounded-2xl border border-slate-200 p-4">
              Justificar por qué una relación siempre se cumple.
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-950">
            Para seguir estudiando
          </h2>

          <p className="leading-7">
            Dentro de la plataforma completa, los estudiantes pueden encontrar
            entradas con video, lectura, preguntas de comprensión, ejemplos
            resueltos y ejercicios propuestos. El objetivo es avanzar de manera
            ordenada y construir estrategias propias de resolución.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/recursos"
              className="inline-flex justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver a recursos
            </Link>

            <Link
              href="/login"
              className="inline-flex justify-center rounded-2xl bg-[#1F2E67] px-5 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Entrar a la plataforma
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}