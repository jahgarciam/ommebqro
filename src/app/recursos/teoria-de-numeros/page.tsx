import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Teoría de números olímpica | Recursos OMMEB Querétaro · IQmat",
  description:
    "Introducción pública a la teoría de números en el entrenamiento olímpico de matemáticas para educación básica.",
};

export default function TeoriaDeNumerosResourcePage() {
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
            Recursos · Teoría de números
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            ¿Qué se estudia en teoría de números olímpica?
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-700">
            La teoría de números estudia las propiedades de los enteros:
            divisibilidad, múltiplos, factores, residuos, paridad, primos y
            patrones numéricos. En la matemática olímpica, esta área ayuda a
            entender por qué ciertos números se comportan de una manera y no de
            otra.
          </p>
        </header>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-950">
            Más que hacer cuentas
          </h2>

          <p className="leading-7">
            En teoría de números, muchas preguntas parecen simples: saber si un
            número es divisible entre otro, encontrar un residuo, reconocer si
            algo siempre es par o impar, o decidir si una expresión puede tomar
            cierto valor.
          </p>

          <p className="leading-7">
            Sin embargo, detrás de esas preguntas hay razonamientos profundos.
            No basta con probar algunos ejemplos; el objetivo es explicar por
            qué una propiedad se cumple siempre, nunca o solo en ciertos casos.
          </p>

          <div className="rounded-3xl bg-[#F7F2E7] p-5">
            <p className="font-semibold text-slate-950">Idea clave</p>
            <p className="mt-2 leading-7">
              La teoría de números enseña a mirar los enteros con estructura:
              no como una lista infinita de números, sino como objetos con
              propiedades que se pueden descubrir y justificar.
            </p>
          </div>
        </section>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-950">
            Ejemplo introductorio
          </h2>

          <p className="leading-7">
            Supón que quieres saber qué ocurre al sumar dos números pares. Si
            pruebas con algunos ejemplos, obtienes:
          </p>

          <ul className="list-disc space-y-2 pl-6 leading-7">
            <li>2 + 4 = 6</li>
            <li>8 + 10 = 18</li>
            <li>14 + 20 = 34</li>
          </ul>

          <p className="leading-7">
            En todos los casos el resultado es par. Pero en olimpiada no basta
            con decir “parece que funciona”. Hay que justificarlo de forma
            general.
          </p>

          <p className="leading-7">
            Un número par puede escribirse como dos veces otro número. Si dos
            números pares se escriben como 2a y 2b, entonces su suma es 2a + 2b,
            que puede reescribirse como 2(a + b). Eso muestra que la suma
            también es par.
          </p>
        </section>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-950">
            Divisibilidad y residuos
          </h2>

          <p className="leading-7">
            Dos ideas centrales en teoría de números son la divisibilidad y los
            residuos. La divisibilidad permite saber cuándo un número contiene a
            otro un número exacto de veces. Los residuos permiten estudiar lo
            que sobra al dividir.
          </p>

          <p className="leading-7">
            Estas ideas aparecen en muchos problemas: calendarios, ciclos,
            patrones repetitivos, números primos, factorizaciones y juegos con
            enteros.
          </p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              La paridad distingue números pares e impares.
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              La divisibilidad ayuda a estudiar factores y múltiplos.
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              Los residuos permiten analizar patrones cíclicos.
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              Los números primos funcionan como piezas básicas de los enteros.
            </div>
          </div>
        </section>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-950">
            Habilidades que se desarrollan
          </h2>

          <p className="leading-7">
            Estudiar teoría de números ayuda a desarrollar habilidades como:
          </p>

          <ul className="list-disc space-y-2 pl-6 leading-7">
            <li>Reconocer patrones numéricos.</li>
            <li>Justificar propiedades generales.</li>
            <li>Trabajar con divisibilidad, factores y múltiplos.</li>
            <li>Analizar casos usando paridad o residuos.</li>
            <li>Construir argumentos sin depender solo de ejemplos.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-950">
            Para seguir estudiando
          </h2>

          <p className="leading-7">
            Dentro de la plataforma completa, los estudiantes pueden avanzar por
            temas de divisibilidad, primos, factorización, máximo común divisor,
            mínimo común múltiplo, residuos y estrategias de demostración. La
            meta es aprender a explicar por qué los números se comportan como
            se comportan.
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