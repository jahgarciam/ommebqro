import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { restoreTopic } from "@/actions/topics";
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
    "topic-restored": "El tema fue restaurado. Quedó oculto para alumnos por seguridad.",
  };

  return messages[success] ?? null;
}

function getErrorMessage(error?: string) {
  if (!error) return null;

  const messages: Record<string, string> = {
    "topic-not-found": "No se encontró el tema eliminado.",
    duplicate:
      "No se puede restaurar porque ya existe un tema activo con el mismo título en esta materia.",
    restore: "No se pudo restaurar el tema.",
    "invalid-topic-restore": "No se pudo restaurar el tema.",
  };

  return messages[error] ?? `Ocurrió un error: ${error}`;
}

export default async function DeletedTopicsPage({
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
    .eq("is_active", false)
    .order("order_index", { ascending: true });

  const topics = (topicsData ?? []) as Topic[];

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <Link
            href={`/admin/materias/${subject.slug}`}
            className="text-sm font-semibold text-[#1F2E67]"
          >
            ← Volver a {subject.name}
          </Link>

          <div
            className="mt-8 h-2 w-24 rounded-full"
            style={{ backgroundColor: subject.color ?? "#1F2E67" }}
          />

          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
            Temas eliminados
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
            Papelera de {subject.name}
          </h1>

          <p className="mt-3 max-w-3xl text-slate-600">
            Aquí aparecen los temas eliminados de forma segura. Puedes
            restaurarlos sin perder sus entradas, preguntas, ejemplos ni
            ejercicios.
          </p>
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
            Temas eliminados
          </h2>

          {topics.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-slate-600 shadow-sm">
              No hay temas eliminados en esta materia.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {topics.map((topic) => (
                <article
                  key={topic.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
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

                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                      Eliminado
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {topic.description ??
                      "Este tema fue eliminado de forma segura."}
                  </p>

                  <form action={restoreTopic} className="mt-5">
                    <input
                      type="hidden"
                      name="subjectSlug"
                      value={subject.slug}
                    />
                    <input type="hidden" name="topicId" value={topic.id} />

                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-[#1F2E67] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      Restaurar tema
                    </button>
                  </form>

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Al restaurarlo, el tema quedará oculto para alumnos hasta
                    que decidas mostrarlo.
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}