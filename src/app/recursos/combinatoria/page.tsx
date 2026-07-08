import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Combinatoria olímpica | Recursos OMMEB Querétaro · IQmat",
  description:
    "Introducción pública a la combinatoria en el entrenamiento olímpico de matemáticas para educación básica.",
};

export default function CombinatoriaResourcePage() {
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
            Recursos públicos · Combinatoria
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            ¿Qué se estudia en combinatoria olímpica?
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-700">
            La combinatoria estudia formas de contar, organizar y analizar
            posibilidades. En los problemas olímpicos, contar no significa solo
            enumerar casos, sino encontrar una estrategia para no olvidar casos
            ni contar el mismo caso varias veces.
          </p>
        </header>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-950">
            Contar con orden
          </h2>

          <p className="leading-7">
            Una dificultad común en combinatoria es que muchos problemas parecen
            sencillos al principio, pero se complican porque hay muchos casos
            posibles. Por eso, antes de empezar a contar, conviene decidir cómo
            se organizarán los casos.
          </p>

          <p className="leading-7">
            Algunas estrategias frecuentes son hacer una tabla, separar por
            casos, fijar primero una decisión, dibujar un árbol de posibilidades
            o buscar una correspondencia entre dos formas de contar.
          </p>

          <div className="rounded-3xl bg-[#F7F2E7] p-5">
            <p className="font-semibold text-slate-950">Idea clave</p>
            <p className="mt-2 leading-7">
              En combinatoria, una buena organización vale tanto como una
              operación. El reto no es solo obtener un número, sino explicar por
              qué ese número cuenta todos los casos y no repite ninguno.
            </p>
          </div>
        </section>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-950">
            Ejemplo introductorio
          </h2>

          <p className="leading-7">
            Supón que tienes tres camisetas y dos pantalones. Si quieres formar
            un conjunto con una camiseta y un pantalón, puedes empezar listando
            las opciones:
          </p>

          <ul className="list-disc space-y-2 pl-6 leading-7">
            <li>Camiseta 1 con pantalón 1 o pantalón 2.</li>
            <li>Camiseta 2 con pantalón 1 o pantalón 2.</li>
            <li>Camiseta 3 con pantalón 1 o pantalón 2.</li>
          </ul>

          <p className="leading-7">
            En total hay 6 conjuntos. Pero lo importante no es solo el resultado,
            sino la estructura: por cada camiseta hay dos opciones de pantalón.
            Esa organización permite contar sin escribir todos los casos cuando
            el problema crece.
          </p>
        </section>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-950">
            Errores comunes al contar
          </h2>

          <p className="leading-7">
            En combinatoria, algunos errores aparecen una y otra vez. Reconocerlos
            ayuda a construir soluciones más claras.
          </p>

          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <li className="rounded-2xl border border-slate-200 p-4">
              Contar dos veces el mismo caso.
            </li>
            <li className="rounded-2xl border border-slate-200 p-4">
              Olvidar casos porque no se usó un orden.
            </li>
            <li className="rounded-2xl border border-slate-200 p-4">
              Confundir si el orden importa o no importa.
            </li>
            <li className="rounded-2xl border border-slate-200 p-4">
              Aplicar una multiplicación sin justificar las decisiones.
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-950">
            Habilidades que se desarrollan
          </h2>

          <p className="leading-7">
            El trabajo con combinatoria fortalece habilidades útiles en muchas
            áreas de la matemática:
          </p>

          <ul className="list-disc space-y-2 pl-6 leading-7">
            <li>Separar un problema en casos.</li>
            <li>Organizar información de manera sistemática.</li>
            <li>Reconocer cuándo dos casos son equivalentes.</li>
            <li>Justificar que una cuenta está completa.</li>
            <li>Buscar métodos alternativos para verificar una respuesta.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-950">
            Para seguir estudiando
          </h2>

          <p className="leading-7">
            Dentro de la plataforma completa, los estudiantes pueden practicar
            con problemas graduados, revisar ejemplos resueltos y avanzar por
            rutas de estudio según su nivel. La combinatoria es especialmente
            valiosa porque enseña a pensar con orden antes de calcular.
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