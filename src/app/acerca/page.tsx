import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "OMMEB_Qro",
  description:
    "Conoce el propósito de la plataforma de entrenamiento olímpico OMMEB Querétaro patrocinada por IQmat.",
};

export default function AcercaPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-10">
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

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/recursos"
                className="inline-flex justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Recursos
              </Link>

              <Link
                href="/login"
                className="inline-flex justify-center rounded-2xl bg-[#1F2E67] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Entrar a la plataforma
              </Link>
            </div>
          </div>

          <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
            OMMEB Querétaro · Patrocinado por IQmat
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Plataforma de entrenamiento olímpico en matemáticas
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
            Esta plataforma es un espacio de estudio autogestivo diseñado para
            apoyar la preparación de estudiantes interesados en la Olimpiada
            Mexicana de Matemáticas para Educación Básica en Querétaro.
          </p>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
            La plataforma organiza contenidos de álgebra, combinatoria,
            geometría y teoría de números mediante rutas de estudio, lecturas,
            videos, preguntas de comprensión, ejemplos resueltos y ejercicios
            propuestos.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">
              ¿Cuál es su propósito?
            </h2>

            <p className="mt-4 leading-7 text-slate-700">
              El propósito de la plataforma es ofrecer una ruta ordenada de
              entrenamiento matemático para que los alumnos puedan estudiar de
              manera progresiva, revisar explicaciones, practicar ejercicios y
              fortalecer su razonamiento.
            </p>

            <p className="mt-4 leading-7 text-slate-700">
              El enfoque no es memorizar respuestas, sino desarrollar ideas,
              reconocer patrones, comparar estrategias y aprender a justificar
              procedimientos matemáticos.
            </p>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">
              ¿A quién está dirigida?
            </h2>

            <p className="mt-4 leading-7 text-slate-700">
              Está pensada para estudiantes de educación básica que participan o
              desean prepararse para procesos de entrenamiento olímpico en
              matemáticas.
            </p>

            <p className="mt-4 leading-7 text-slate-700">
              Los contenidos se organizan por nivel y materia, de manera que
              cada estudiante pueda avanzar según su grado escolar y su progreso
              dentro de la plataforma.
            </p>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">
              Materias de entrenamiento
            </h2>

            <p className="mt-4 leading-7 text-slate-700">
              La preparación olímpica se organiza alrededor de cuatro áreas
              fundamentales:
            </p>

            <ul className="mt-4 space-y-3 text-slate-700">
              <li>
                <span className="font-semibold text-slate-950">Álgebra:</span>{" "}
                patrones, ecuaciones, expresiones y relaciones numéricas.
              </li>

              <li>
                <span className="font-semibold text-slate-950">
                  Combinatoria:
                </span>{" "}
                conteo, arreglos, casos posibles y estrategias de organización.
              </li>

              <li>
                <span className="font-semibold text-slate-950">Geometría:</span>{" "}
                figuras, relaciones métricas, ángulos, áreas y razonamiento
                visual.
              </li>

              <li>
                <span className="font-semibold text-slate-950">
                  Teoría de números:
                </span>{" "}
                divisibilidad, residuos, factores, múltiplos y propiedades de
                los enteros.
              </li>
            </ul>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">
              ¿Cómo se estudia?
            </h2>

            <p className="mt-4 leading-7 text-slate-700">
              Cada entrada de estudio puede incluir video, lectura, preguntas de
              comprensión, ejemplos resueltos paso a paso y ejercicios
              propuestos.
            </p>

            <p className="mt-4 leading-7 text-slate-700">
              La plataforma permite que el estudiante avance por secciones y
              mantenga un seguimiento de su progreso.
            </p>
          </section>
        </div>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-bold text-slate-950">
            Acceso y privacidad
          </h2>

          <p className="mt-4 leading-7 text-slate-700">
            El acceso completo se realiza mediante cuenta de Google. Este
            mecanismo ayuda a evitar cuentas duplicadas y permite guardar el
            avance del estudiante.
          </p>

          <p className="mt-4 leading-7 text-slate-700">
            La plataforma no solicita información sensible innecesaria para el
            entrenamiento. La información de avance se utiliza para organizar la
            experiencia de estudio y mejorar el seguimiento académico.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/privacidad"
              className="inline-flex justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Ver aviso de privacidad
            </Link>

            <Link
              href="/recursos"
              className="inline-flex justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Explorar recursos
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
