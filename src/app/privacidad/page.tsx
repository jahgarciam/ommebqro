import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-10">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
          Aviso de privacidad
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-950">
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
            progreso académico será utilizado únicamente para seguimiento del
            entrenamiento olímpico dentro de la plataforma.
          </p>

          <p>
            La plataforma puede mostrar espacios publicitarios controlados, sin
            interrumpir cuestionarios, actividades de concentración ni futuros
            exámenes en línea.
          </p>
        </div>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-2xl bg-[#1F2E67] px-5 py-3 font-semibold text-white"
        >
          Volver al inicio
        </Link>
      </article>
    </main>
  );
}