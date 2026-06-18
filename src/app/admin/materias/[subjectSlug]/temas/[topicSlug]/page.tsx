import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteEntry } from "@/actions/entries";
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
};

type Entry = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  status: "draft" | "published" | "hidden" | "archived";
  order_index: number;
};

export default async function AdminTopicPage({
  params,
}: {
  params: Promise<{ subjectSlug: string; topicSlug: string }>;
}) {
  const { subjectSlug, topicSlug } = await params;

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

  const { data: topicData } = await supabase
    .from("topics")
    .select("id, title, slug, description, is_seed_topic")
    .eq("subject_id", subject.id)
    .eq("slug", topicSlug)
    .eq("is_active", true)
    .single();

  const topic = topicData as Topic | null;

  if (!topic) {
    notFound();
  }

  const { data: entriesData } = await supabase
    .from("entries")
    .select("id, title, slug, summary, status, order_index")
    .eq("topic_id", topic.id)
    .order("order_index", { ascending: true });

  const entries = (entriesData ?? []) as Entry[];

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

          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
            Tema de {subject.name}
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
            {topic.title}
          </h1>

          <p className="mt-3 max-w-3xl text-slate-600">
            {topic.description ??
              "Desde aquí se crearán las entradas de estudio de este tema."}
          </p>

          <div className="mt-4">
            {topic.is_seed_topic ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Temario base
              </span>
            ) : (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1F2E67]">
                Creado por admin
              </span>
            )}
          </div>

          <div className="mt-6">
            <Link
              href={`/admin/materias/${subject.slug}/temas/${topic.slug}/crear-entrada`}
              className="inline-flex rounded-2xl bg-[#1F2E67] px-5 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Crear nueva entrada
            </Link>
          </div>
        </div>

        <section className="mt-6">
          <h2 className="mb-4 text-xl font-bold text-slate-950">
            Entradas del tema
          </h2>

          {entries.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-slate-600 shadow-sm">
              Todavía no hay entradas para este tema. Crea la primera entrada
              para agregar video, lectura, cuestionario, ejemplos y ejercicios.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {entries.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-950">
                      {entry.title}
                    </h3>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {entry.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {entry.summary ?? "Entrada sin resumen."}
                  </p>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={`/admin/materias/${subject.slug}/temas/${topic.slug}/entradas/${entry.slug}`}
                      className="inline-flex justify-center rounded-2xl bg-[#1F2E67] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      Alimentar entrada
                    </Link>

                    <form action={deleteEntry}>
                      <input
                        type="hidden"
                        name="subjectSlug"
                        value={subject.slug}
                      />
                      <input
                        type="hidden"
                        name="topicSlug"
                        value={topic.slug}
                      />
                      <input type="hidden" name="entryId" value={entry.id} />

                      <button
                        type="submit"
                        className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        Eliminar entrada
                      </button>
                    </form>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Si eliminas una entrada, también se eliminarán sus preguntas,
                    ejemplos, ejercicios e imágenes asociadas.
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