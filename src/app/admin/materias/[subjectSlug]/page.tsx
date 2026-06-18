import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { toggleTopicStudentVisibility } from "@/actions/topics";
import { createClient } from "@/lib/supabase/server";

type Subject = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
};

type Topic = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  is_seed_topic: boolean;
  student_visible: boolean;
};

function getSuccessMessage(success?: string) {
  if (!success) return null;

  const messages: Record<string, string> = {
    "topic-visible": "El tema ahora es visible para los alumnos.",
    "topic-hidden": "El tema ahora está oculto para los alumnos.",
    "topic-deleted": "El tema fue eliminado de forma segura.",
  };

  return messages[success] ?? null;
}

function getErrorMessage(error?: string) {
  if (!error) return null;

  const messages: Record<string, string> = {
    invalid: "Revisa los datos del tema.",
    slug: "No se pudo generar una URL válida para el tema.",
    duplicate: "Ya existe un tema con ese título en esta materia.",
    create: "No se pudo crear el tema.",
    settings: "El tema se creó, pero no se pudieron guardar sus niveles.",
    "topic-visibility": "No se pudo cambiar la visibilidad del tema.",
    "invalid-topic-delete": "No se pudo eliminar el tema.",
    "topic-not-found": "No se encontró el tema.",
  };

  return messages[error] ?? `Ocurrió un error: ${error}`;
}

export default async function AdminSubjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectSlug: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { subjectSlug } = await params;
  const query = await searchParams;

  const successMessage = getSuccessMessage(query.success);
  const errorMessage = getErrorMessage(query.error);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: subjectData } = await supabase
    .from("subjects")
    .select("id, name, slug, color")
    .eq("slug", subjectSlug)
    .eq("is_active", true)
    .single();

  const subject = subjectData as Subject | null;

  if (!subject) {
    notFound();
  }

  const { data: topicsData } = await supabase
    .from("topics")
    .select("id, title, slug, description, is_seed_topic, student_visible")
    .eq("subject_id", subject.id)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  const topics = (topicsData ?? []) as Topic[];

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <Link href="/admin" className="text-sm font-semibold text-[#1F2E67]">
            ← Volver al panel
          </Link>

          <div
            className="mt-8 h-2 w-24 rounded-full"
            style={{ backgroundColor: subject.color ?? "#1F2E67" }}
          />

          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
            Materia
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
            {subject.name}
          </h1>

          <p className="mt-3 max-w-3xl text-slate-600">
            Desde aquí puedes alimentar esta materia: crear temas nuevos o
            seleccionar un tema existente para agregar entradas con video,
            lectura, cuestionario, ejemplos y ejercicios.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/admin/materias/${subject.slug}/crear-tema`}
              className="inline-flex justify-center rounded-2xl bg-[#1F2E67] px-5 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Crear nuevo tema
            </Link>

            <Link
              href={`/admin/materias/${subject.slug}/temas-eliminados`}
              className="inline-flex justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Ver temas eliminados
            </Link>
          </div>
        </div>

        {successMessage ? (
          <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <section className="mt-6">
          <h2 className="mb-4 text-xl font-bold text-slate-950">
            Temas de {subject.name}
          </h2>

          {topics.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-slate-600 shadow-sm">
              Todavía no hay temas para esta materia.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {topics.map((topic) => (
                <article
                  key={topic.id}
                  className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-950">
                      {topic.title}
                    </h3>

                    {topic.is_seed_topic ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Temario base
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1F2E67]">
                        Creado por admin
                      </span>
                    )}

                    {topic.student_visible ? (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        Visible para alumnos
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                        Oculto para alumnos
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {topic.description ??
                      "Selecciona este tema para crear o administrar sus entradas."}
                  </p>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Link
                      href={`/admin/materias/${subject.slug}/temas/${topic.slug}`}
                      className="inline-flex justify-center rounded-2xl bg-[#1F2E67] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      Alimentar tema
                    </Link>

                    <Link
                      href={`/admin/materias/${subject.slug}/temas/${topic.slug}/editar`}
                      className="inline-flex justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Editar tema
                    </Link>

                    <form action={toggleTopicStudentVisibility}>
                      <input
                        type="hidden"
                        name="subjectSlug"
                        value={subject.slug}
                      />
                      <input type="hidden" name="topicId" value={topic.id} />
                      <input
                        type="hidden"
                        name="targetVisible"
                        value={topic.student_visible ? "false" : "true"}
                      />

                      <button
                        type="submit"
                        className={`w-full rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                          topic.student_visible
                            ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                            : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        {topic.student_visible
                          ? "Ocultar a alumnos"
                          : "Mostrar a alumnos"}
                      </button>
                    </form>
                  </div>

                  {!topic.student_visible ? (
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      Este tema puede seguir siendo alimentado por los
                      administradores, pero no aparecerá en la vista de los
                      alumnos.
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}