import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Aviso de privacidad | OMMEB Querétaro · IQmat",
  description:
    "Aviso de privacidad de la plataforma de entrenamiento olímpico OMMEB Querétaro patrocinada por IQmat.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <article className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/logos/logoOMMEB.png"
              alt="Logo OMMEB Querétaro"
              width={110}
              height={60}
              className="h-auto w-28 object-contain"
              priority
            />

            <Image
              src="/logos/IQmat.jpg"
              alt="Logo IQmat"
              width={70}
              height={70}
              className="h-16 w-16 rounded-2xl object-contain"
              priority
            />
          </div>

          <nav className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link
              href="/"
              className="rounded-2xl border border-slate-300 px-4 py-2 text-slate-700 transition hover:bg-slate-50"
            >
              Inicio
            </Link>

            <Link
              href="/acerca"
              className="rounded-2xl border border-slate-300 px-4 py-2 text-slate-700 transition hover:bg-slate-50"
            >
              Acerca
            </Link>

            <Link
              href="/login"
              className="rounded-2xl bg-[#1F2E67] px-4 py-2 text-white transition hover:opacity-90"
            >
              Entrar
            </Link>
          </nav>
        </header>

        <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
          Aviso de privacidad
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-950 md:text-4xl">
          Plataforma OMMEB Querétaro patrocinada por IQmat
        </h1>

        <div className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
          <p>
            Esta plataforma solicita únicamente los datos mínimos necesarios
            para asignar un nivel de estudio y guardar el avance académico del
            alumno: primer nombre, primer apellido, correo electrónico y grado
            escolar.
          </p>

          <p>
            El acceso se realiza exclusivamente mediante una cuenta de Google.
            No se solicitan contraseñas dentro de esta plataforma.
          </p>

          <p>
            La información registrada no será visible para otros alumnos. El
            progreso académico será utilizado únicamente para organizar la
            experiencia de estudio y dar seguimiento al entrenamiento olímpico
            dentro de la plataforma.
          </p>

          <p>
            La plataforma puede mostrar espacios publicitarios controlados en
            páginas públicas o zonas compatibles con el estudio. Estos espacios
            no deben interrumpir cuestionarios, ejercicios, actividades de
            concentración ni futuros exámenes en línea.
          </p>

          <p>
            El usuario puede abandonar la plataforma en cualquier momento. La
            información de avance se conserva con el propósito de mantener la
            continuidad del estudio cuando el usuario vuelva a iniciar sesión.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
      </article>
    </main>
  );
}