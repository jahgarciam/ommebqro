import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateExercise } from "@/actions/entry-content";
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
};

type Entry = {
  id: string;
  title: string;
  slug: string;
};

type Exercise = {
  id: string;
  entry_id: string;
  statement: string;
  hint_1: string | null;
  hint_2: string | null;
  hint_3: string | null;
  solution_content: string | null;
};

function getErrorMessage(error?: string) {
  if (!error) return null;

  const messages: Record<string, string> = {
    "invalid-statement": "El enunciado debe tener entre 3 y 20000 caracteres.",
    "hint-too-long": "Cada pista debe tener máximo 1000 caracteres.",
    "solution-too-long": "La solución debe tener máximo 5000 caracteres.",
    "unsafe-content": "El contenido contiene HTML no permitido.",
    "update-exercise": "No se pudo actualizar el ejercicio.",
  };

  return messages[error] ?? `No se pudo actualizar el ejercicio. Error: ${error}`;
}

export default async function EditExercisePage({
  params,
  searchParams,
}: {
  params: Promise<{
    subjectSlug: string;
    topicSlug: string;
    entrySlug: string;
    exerciseId: string;
  }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { subjectSlug, topicSlug, entrySlug, exerciseId } = await params;
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
    .select("id, title, slug")
    .eq("subject_id", subject.id)
    .eq("slug", topicSlug)
    .eq("is_active", true)
    .single();

  const topic = topicData as Topic | null;

  if (!topic) {
    notFound();
  }

  const { data: entryData } = await supabase
    .from("entries")
    .select("id, title, slug")
    .eq("topic_id", topic.id)
    .eq("slug", entrySlug)
    .single();

  const entry = entryData as Entry | null;

  if (!entry) {
    notFound();
  }

  const { data: exerciseData } = await supabase
    .from("proposed_exercises")
    .select("id, entry_id, statement, hint_1, hint_2, hint_3, solution_content")
    .eq("id", exerciseId)
    .eq("entry_id", entry.id)
    .single();

  const exercise = exerciseData as Exercise | null;

  if (!exercise) {
    notFound();
  }

  const backUrl = `/admin/materias/${subject.slug}/temas/${topic.slug}/entradas/${entry.slug}`;

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <Link href={backUrl} className="text-sm font-semibold text-[#1F2E67]">
            ← Volver a la entrada
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
            Editar ejercicio
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
            {entry.title}
          </h1>

          <p className="mt-3 text-slate-600">
            Modifica el enunciado, las pistas o la solución del ejercicio.
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <form
          action={updateExercise}
          className="mt-6 space-y-5 rounded-3xl bg-white p-6 shadow-sm md:p-8"
        >
          <input type="hidden" name="subjectSlug" value={subject.slug} />
          <input type="hidden" name="topicSlug" value={topic.slug} />
          <input type="hidden" name="entrySlug" value={entry.slug} />
          <input type="hidden" name="entryId" value={entry.id} />
          <input type="hidden" name="exerciseId" value={exercise.id} />

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Enunciado
            </span>
            <textarea
              name="statement"
              required
              rows={8}
              defaultValue={exercise.statement}
              className="w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
            <p className="mt-2 text-xs text-slate-500">
              Puedes usar Markdown y LaTeX con $...$ o $$...$$.
            </p>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Pista 1
            </span>
            <input
              name="hint1"
              maxLength={1000}
              defaultValue={exercise.hint_1 ?? ""}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Pista 2
            </span>
            <input
              name="hint2"
              maxLength={1000}
              defaultValue={exercise.hint_2 ?? ""}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Pista 3
            </span>
            <input
              name="hint3"
              maxLength={1000}
              defaultValue={exercise.hint_3 ?? ""}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Solución o comentario final
            </span>
            <textarea
              name="solutionContent"
              rows={6}
              maxLength={5000}
              defaultValue={exercise.solution_content ?? ""}
              className="w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
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
      </section>
    </main>
  );
}