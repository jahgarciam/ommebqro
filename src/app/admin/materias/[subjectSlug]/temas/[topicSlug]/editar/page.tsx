import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteTopic, updateTopic } from "@/actions/topics";
import { createClient } from "@/lib/supabase/server";

type Subject = {
  id: string;
  name: string;
  slug: string;
};

type Topic = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  subject_id: string;
  is_seed_topic: boolean;
  student_visible: boolean;
};

function getErrorMessage(error?: string) {
  if (!error) return null;

  const messages: Record<string, string> = {
    "invalid-title": "El título debe tener entre 3 y 120 caracteres.",
    "invalid-description": "La descripción no debe superar 500 caracteres.",
    "unsafe-content": "El contenido contiene HTML no permitido.",
    slug: "No se pudo generar una URL válida para el tema.",
    duplicate: "Ya existe un tema con ese título en la materia seleccionada.",
    "subject-not-found": "No se encontró la materia seleccionada.",
    update: "No se pudo actualizar el tema.",
    "delete-confirmation":
      "Para eliminar el tema debes escribir exactamente el título y la palabra ELIMINAR.",
    "delete-topic": "No se pudo eliminar el tema.",
  };

  return messages[error] ?? `No se pudo guardar el tema. Error: ${error}`;
}

export default async function EditTopicPage({
  params,
  searchParams,
}: {
  params: Promise<{
    subjectSlug: string;
    topicSlug: string;
  }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { subjectSlug, topicSlug } = await params;
  const query = await searchParams;
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
    .select("id, name, slug")
    .eq("slug", subjectSlug)
    .eq("is_active", true)
    .single();

  const subject = subjectData as Subject | null;

  if (!subject) {
    notFound();
  }

  const { data: topicData } = await supabase
    .from("topics")
    .select(
      "id, title, slug, description, subject_id, is_seed_topic, student_visible"
    )
    .eq("subject_id", subject.id)
    .eq("slug", topicSlug)
    .eq("is_active", true)
    .single();

  const topic = topicData as Topic | null;

  if (!topic) {
    notFound();
  }

  const { data: subjectsData } = await supabase
    .from("subjects")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  const subjects = (subjectsData ?? []) as Subject[];

  const backUrl = `/admin/materias/${subject.slug}`;

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <Link href={backUrl} className="text-sm font-semibold text-[#1F2E67]">
            ← Volver a {subject.name}
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
            Editar tema
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
            {topic.title}
          </h1>

          <p className="mt-3 text-slate-600">
            Corrige el título, la descripción o cambia el tema completo a otra
            materia. Las entradas, preguntas, ejemplos y ejercicios se moverán
            junto con el tema.
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <form
          action={updateTopic}
          className="mt-6 space-y-5 rounded-3xl bg-white p-6 shadow-sm md:p-8"
        >
          <input type="hidden" name="topicId" value={topic.id} />
          <input type="hidden" name="currentSubjectSlug" value={subject.slug} />
          <input type="hidden" name="currentTopicSlug" value={topic.slug} />

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Título del tema
            </span>
            <input
              name="title"
              required
              maxLength={120}
              defaultValue={topic.title}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
            <p className="mt-2 text-xs text-slate-500">
              Si cambias el título, también cambiará la URL interna del tema.
            </p>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Descripción
            </span>
            <textarea
              name="description"
              rows={4}
              maxLength={500}
              defaultValue={topic.description ?? ""}
              className="w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Materia
            </span>
            <select
              name="targetSubjectId"
              defaultValue={topic.subject_id}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            >
              {subjects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              Cambiar la materia moverá todo el tema con sus entradas y
              contenido.
            </p>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="rounded-2xl bg-[#1F2E67] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Guardar cambios
            </button>

            <Link
              href={backUrl}
              className="inline-flex justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </Link>
          </div>
        </form>

        <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
            Eliminar tema
          </p>

          <h2 className="mt-2 text-2xl font-bold text-red-900">
            Eliminación segura
          </h2>

          <p className="mt-3 text-sm leading-6 text-red-800">
            Esta acción ocultará el tema para alumnos y lo quitará del panel de
            administración normal. No borra físicamente las entradas ni el
            contenido de la base de datos.
          </p>

          <form action={deleteTopic} className="mt-5 space-y-4">
            <input type="hidden" name="topicId" value={topic.id} />
            <input type="hidden" name="subjectSlug" value={subject.slug} />
            <input type="hidden" name="topicTitle" value={topic.title} />
            <input type="hidden" name="topicSlug" value={topic.slug} />

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-red-900">
                Para confirmar, escribe exactamente el título:
              </span>
              <input
                name="confirmTitle"
                placeholder={topic.title}
                className="w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-red-900">
                Escribe ELIMINAR:
              </span>
              <input
                name="confirmWord"
                placeholder="ELIMINAR"
                className="w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </label>

            <button
              type="submit"
              className="rounded-2xl bg-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800"
            >
              Eliminar tema de forma segura
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}