import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Geometría olímpica | Recursos OMMEB Querétaro · IQmat",
  description:
    "Introducción pública a la geometría en el entrenamiento olímpico de matemáticas para educación básica.",
};

export default function GeometriaResourcePage() {
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
            Recursos · Geometría
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            ¿Qué se estudia en geometría olímpica?
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-700">
            La geometría olímpica estudia figuras, relaciones, medidas y
            configuraciones. Pero, sobre todo, enseña a mirar con atención:
            descubrir trazos útiles, reconocer patrones visuales y justificar
            por qué una relación geométrica es verdadera.
          </p>
        </header>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-950">
            Ver antes de calcular
          </h2>

          <p className="leading-7">
            En muchos problemas escolares, la geometría se presenta como una
            colección de fórmulas. En el entrenamiento olímpico, en cambio, la
            primera pregunta suele ser: ¿qué relación hay entre las partes de la
            figura?
          </p>

          <p className="leading-7">
            Antes de calcular un área, un ángulo o una longitud, conviene
            observar paralelismos, simetrías, triángulos semejantes, puntos
            medios, circunferencias, diagonales y trazos auxiliares. Una buena
            observación puede convertir un problema difícil en una cadena de
            ideas sencillas.
          </p>

          <div className="rounded-3xl bg-[#F7F2E7] p-5">
            <p className="font-semibold text-slate-950">Idea clave</p>
            <p className="mt-2 leading-7">
              En geometría olímpica, un dibujo no es solo una ilustración. Es
              una fuente de información. Aprender a leer la figura es parte
              central de la solución.
            </p>
          </div>
        </section>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-950">
            Ejemplo introductorio
          </h2>

          <p className="leading-7">
            Supón que tienes un triángulo y unes los puntos medios de dos de
            sus lados. El segmento que aparece dentro del triángulo no está ahí
            por casualidad: suele ser paralelo al tercer lado y mide la mitad de
            este.
          </p>

          <p className="leading-7">
            Esa observación permite resolver muchos problemas sin medir
            directamente. En vez de calcular desde cero, usamos una relación
            geométrica: los puntos medios producen una estructura más pequeña
            pero relacionada con la figura original.
          </p>

          <ul className="list-disc space-y-2 pl-6 leading-7">
            <li>¿Qué puntos especiales aparecen en la figura?</li>
            <li>¿Hay segmentos paralelos o perpendiculares?</li>
            <li>¿Se forman triángulos semejantes?</li>
            <li>¿Conviene agregar un trazo auxiliar?</li>
          </ul>
        </section>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-950">
            Trazos auxiliares
          </h2>

          <p className="leading-7">
            Un trazo auxiliar es una línea que no aparece originalmente en el
            problema, pero que ayuda a revelar relaciones ocultas. Puede ser una
            altura, una mediana, una diagonal, un radio, una paralela o una
            prolongación de algún lado.
          </p>

          <p className="leading-7">
            La dificultad no está solo en trazar una línea, sino en justificar
            por qué ese trazo ayuda. Un buen trazo permite conectar datos que
            antes parecían separados.
          </p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              Trazar una altura puede revelar triángulos rectángulos.
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              Trazar una paralela puede mostrar semejanza.
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              Unir puntos medios puede simplificar longitudes.
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              Agregar radios ayuda en problemas con circunferencias.
            </div>
          </div>
        </section>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-950">
            Habilidades que se desarrollan
          </h2>

          <p className="leading-7">
            El estudio de geometría olímpica fortalece habilidades como:
          </p>

          <ul className="list-disc space-y-2 pl-6 leading-7">
            <li>Observar relaciones visuales con precisión.</li>
            <li>Reconocer figuras dentro de figuras más grandes.</li>
            <li>Usar semejanza, paralelismo y simetría.</li>
            <li>Construir argumentos a partir de propiedades geométricas.</li>
            <li>Explicar por qué un resultado no depende solo de la medición.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-950">
            Para seguir estudiando
          </h2>

          <p className="leading-7">
            Dentro de la plataforma completa, los estudiantes pueden trabajar
            con temas como ángulos, áreas, semejanza, circunferencias,
            cuadriláteros y puntos notables. El objetivo es que aprendan a
            construir soluciones, no solo a aplicar fórmulas.
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