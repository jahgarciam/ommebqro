import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MarkdownMath } from "@/components/markdown/MarkdownMath";
import {
  addExample,
  addExercise,
  addReadingQuestion,
} from "@/actions/entry-content";
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
};

type Entry = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  youtube_video_id: string | null;
  reading_content: string | null;
  status: "draft" | "published" | "hidden" | "archived";
  estimated_minutes: number | null;
  levels:
    | {
        name: string;
        slug: string;
      }
    | {
        name: string;
        slug: string;
      }[]
    | null;
  trainer_channels:
    | {
        trainer_name: string;
        channel_name: string;
        youtube_channel_url: string;
      }
    | {
        trainer_name: string;
        channel_name: string;
        youtube_channel_url: string;
      }[]
    | null;
};

type Question = {
  id: string;
  question_text: string;
  explanation: string | null;
  order_index: number;
};

type Example = {
  id: string;
  title: string;
  content: string;
  image_path: string | null;
  image_alt: string | null;
  order_index: number;
};

type Exercise = {
  id: string;
  statement: string;
  hint_1: string | null;
  hint_2: string | null;
  hint_3: string | null;
  solution_content: string | null;
  order_index: number;
};

function getLevelName(entry: Entry) {
  if (!entry.levels) return "Nivel";
  if (Array.isArray(entry.levels)) return entry.levels[0]?.name ?? "Nivel";
  return entry.levels.name;
}

function getTrainer(entry: Entry) {
  if (!entry.trainer_channels) return null;

  if (Array.isArray(entry.trainer_channels)) {
    return entry.trainer_channels[0] ?? null;
  }

  return entry.trainer_channels;
}

export default async function AdminEntryPage({
  params,
}: {
  params: Promise<{
    subjectSlug: string;
    topicSlug: string;
    entrySlug: string;
  }>;
}) {
  const { subjectSlug, topicSlug, entrySlug } = await params;

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
    .select(
      `
      id,
      title,
      slug,
      summary,
      youtube_video_id,
      reading_content,
      status,
      estimated_minutes,
      levels:level_id (
        name,
        slug
      ),
      trainer_channels:trainer_channel_id (
        trainer_name,
        channel_name,
        youtube_channel_url
      )
    `
    )
    .eq("topic_id", topic.id)
    .eq("slug", entrySlug)
    .single();

  const entry = entryData as Entry | null;

  if (!entry) {
    notFound();
  }

  const { data: questionsData } = await supabase
    .from("quiz_questions")
    .select("id, question_text, explanation, order_index")
    .eq("entry_id", entry.id)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  const questions = (questionsData ?? []) as Question[];

  const { data: examplesData } = await supabase
    .from("examples")
    .select("id, title, content, image_path, image_alt, order_index")
    .eq("entry_id", entry.id)
    .order("order_index", { ascending: true });

  const examples = (examplesData ?? []) as Example[];

  const { data: exercisesData } = await supabase
    .from("proposed_exercises")
    .select(
      "id, statement, hint_1, hint_2, hint_3, solution_content, order_index"
    )
    .eq("entry_id", entry.id)
    .order("order_index", { ascending: true });

  const exercises = (exercisesData ?? []) as Exercise[];
  const trainer = getTrainer(entry);

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <Link
            href={`/admin/materias/${subject.slug}/temas/${topic.slug}`}
            className="text-sm font-semibold text-[#1F2E67]"
          >
            ← Volver a {topic.title}
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
            Entrada de {subject.name}
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
            {entry.title}
          </h1>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {getLevelName(entry)}
            </span>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1F2E67]">
              {entry.status}
            </span>

            {entry.estimated_minutes ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {entry.estimated_minutes} min
              </span>
            ) : null}
          </div>

          {entry.summary ? (
            <p className="mt-4 max-w-3xl text-slate-600">{entry.summary}</p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/admin/materias/${subject.slug}/temas/${topic.slug}/entradas/${entry.slug}/editar`}
              className="inline-flex rounded-2xl bg-[#1F2E67] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Editar entrada base
            </Link>
            <Link
  href={`/admin/materias/${subject.slug}/temas/${topic.slug}/entradas/${entry.slug}/vista-previa`}
  className="inline-flex rounded-2xl border border-[#1F2E67] bg-white px-5 py-3 text-sm font-semibold text-[#1F2E67] transition hover:bg-[#1F2E67] hover:text-white"
>
  Vista previa como alumno
</Link>
            <Link
              href={`/admin/materias/${subject.slug}/temas/${topic.slug}`}
              className="inline-flex rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver al tema
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          <section className="space-y-6">
            <AdminSection title="1. Video y lectura">
              {trainer ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-600">
                    Antes del video se mostrará:
                  </p>

                  <p className="mt-2 font-semibold text-slate-950">
                    Este video fue preparado por {trainer.trainer_name}.
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Canal: {trainer.channel_name}
                  </p>

                  <a
                    href={trainer.youtube_channel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex text-sm font-semibold text-[#1F2E67]"
                  >
                    Ver canal →
                  </a>
                </div>
              ) : null}

              {entry.youtube_video_id ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <iframe
                    className="aspect-video w-full"
                    src={`https://www.youtube.com/embed/${entry.youtube_video_id}`}
                    title={entry.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : null}

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-950">Lectura</h3>
                <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {entry.reading_content}
                </pre>
              </div>
            </AdminSection>

            <AdminSection title="2. Preguntas de comprensión de lectura">
              <p className="text-sm leading-6 text-slate-600">
                Estas preguntas aparecerán inmediatamente después de la lectura
                en la vista del alumno.
              </p>

              <form action={addReadingQuestion} className="mt-5 space-y-4">
                <HiddenFields
                  subjectSlug={subject.slug}
                  topicSlug={topic.slug}
                  entryId={entry.id}
                  entrySlug={entry.slug}
                />

                <Field label="Pregunta">
                  <textarea
                    name="questionText"
                    required
                    rows={3}
                    className={textareaClass}
                    placeholder="Ej. ¿Qué significa que dos triángulos sean semejantes?"
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Opción A">
                    <input name="optionA" required className={inputClass} />
                  </Field>

                  <Field label="Opción B">
                    <input name="optionB" required className={inputClass} />
                  </Field>

                  <Field label="Opción C">
                    <input name="optionC" required className={inputClass} />
                  </Field>

                  <Field label="Opción D">
                    <input name="optionD" required className={inputClass} />
                  </Field>
                </div>

                <Field label="Respuesta correcta">
                  <select name="correctOption" required className={inputClass}>
                    <option value="A">Opción A</option>
                    <option value="B">Opción B</option>
                    <option value="C">Opción C</option>
                    <option value="D">Opción D</option>
                  </select>
                </Field>

                <Field label="Retroalimentación breve">
                  <textarea
                    name="explanation"
                    rows={3}
                    className={textareaClass}
                    placeholder="Explica por qué esa opción es correcta."
                  />
                </Field>

                <SubmitButton>Agregar pregunta</SubmitButton>
              </form>
            </AdminSection>

            <AdminSection title="3. Ejemplos resueltos paso a paso">
              <form action={addExample} className="space-y-4">
                <HiddenFields
                  subjectSlug={subject.slug}
                  topicSlug={topic.slug}
                  entryId={entry.id}
                  entrySlug={entry.slug}
                />

                <Field label="Título del ejemplo">
                  <input
                    name="title"
                    required
                    className={inputClass}
                    placeholder="Ej. Ejemplo 1: comparación de lados"
                  />
                </Field>

                <Field label="Desarrollo paso a paso">
                  <textarea
                    name="content"
                    required
                    rows={8}
                    className={textareaClass}
                    placeholder="Puedes usar Markdown y LaTeX."
                  />
                </Field>

                <Field label="Imagen opcional del ejemplo">
                  <input
                    name="imageFile"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 file:mr-4 file:rounded-xl file:border-0 file:bg-[#1F2E67] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Formatos permitidos: PNG, JPG o WEBP. Máximo 5 MB.
                  </p>
                </Field>

                <Field label="Descripción de la imagen">
                  <input
                    name="imageAlt"
                    maxLength={200}
                    className={inputClass}
                    placeholder="Ej. Diagrama de dos triángulos semejantes"
                  />
                </Field>

                <SubmitButton>Agregar ejemplo</SubmitButton>
              </form>
            </AdminSection>

            <AdminSection title="4. Ejercicios propuestos">
              <form action={addExercise} className="space-y-4">
                <HiddenFields
                  subjectSlug={subject.slug}
                  topicSlug={topic.slug}
                  entryId={entry.id}
                  entrySlug={entry.slug}
                />

                <Field label="Enunciado">
                  <textarea
                    name="statement"
                    required
                    rows={5}
                    className={textareaClass}
                    placeholder="Escribe el ejercicio que el alumno resolverá."
                  />
                </Field>

                <Field label="Pista 1">
                  <input name="hint1" className={inputClass} />
                </Field>

                <Field label="Pista 2">
                  <input name="hint2" className={inputClass} />
                </Field>

                <Field label="Pista 3">
                  <input name="hint3" className={inputClass} />
                </Field>

                <Field label="Solución o comentario final">
                  <textarea
                    name="solutionContent"
                    rows={5}
                    className={textareaClass}
                  />
                </Field>

                <SubmitButton>Agregar ejercicio</SubmitButton>
              </form>
            </AdminSection>
          </section>

          <aside className="space-y-6">
            <SummaryCard title="Preguntas" count={questions.length}>
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="rounded-2xl border border-slate-200 p-3"
                >
                  <div className="line-clamp-4 text-sm leading-6 text-slate-700">
                    <MarkdownMath content={question.question_text} />
                  </div>

                  <Link
                    href={`/admin/materias/${subject.slug}/temas/${topic.slug}/entradas/${entry.slug}/preguntas/${question.id}/editar`}
                    className="mt-3 inline-flex w-full justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Editar pregunta
                  </Link>
                </div>
              ))}
            </SummaryCard>

            <SummaryCard title="Ejemplos" count={examples.length}>
              {examples.map((example) => (
                <div
                  key={example.id}
                  className="rounded-2xl border border-slate-200 p-3"
                >
                  <p className="line-clamp-3 text-sm leading-6 text-slate-700">
                    {example.title}
                  </p>

                  <Link
                    href={`/admin/materias/${subject.slug}/temas/${topic.slug}/entradas/${entry.slug}/ejemplos/${example.id}/editar`}
                    className="mt-3 inline-flex w-full justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Editar ejemplo
                  </Link>
                </div>
              ))}
            </SummaryCard>

            <SummaryCard title="Ejercicios" count={exercises.length}>
  {exercises.map((exercise) => (
    <div
      key={exercise.id}
      className="rounded-2xl border border-slate-200 p-3"
    >
      <p className="line-clamp-3 text-sm leading-6 text-slate-700">
        {exercise.statement}
      </p>

      <Link
        href={`/admin/materias/${subject.slug}/temas/${topic.slug}/entradas/${entry.slug}/ejercicios/${exercise.id}/editar`}
        className="mt-3 inline-flex w-full justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Editar ejercicio
      </Link>
    </div>
  ))}
</SummaryCard>
          </aside>
        </div>
      </section>
    </main>
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20";

const textareaClass =
  "w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 placeholder:text-slate-500 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20";

function AdminSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-800">
        {label}
      </span>
      {children}
    </label>
  );
}

function HiddenFields({
  subjectSlug,
  topicSlug,
  entryId,
  entrySlug,
}: {
  subjectSlug: string;
  topicSlug: string;
  entryId: string;
  entrySlug: string;
}) {
  return (
    <>
      <input type="hidden" name="subjectSlug" value={subjectSlug} />
      <input type="hidden" name="topicSlug" value={topicSlug} />
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="entrySlug" value={entrySlug} />
    </>
  );
}

function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="w-full rounded-2xl bg-[#1F2E67] px-5 py-3 font-semibold text-white transition hover:opacity-90"
    >
      {children}
    </button>
  );
}

function SummaryCard({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold text-slate-950">{title}</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {count}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {count === 0 ? (
          <p className="text-sm text-slate-500">Todavía no hay registros.</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function MiniItem({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-3">
      <p className="line-clamp-3 text-sm leading-6 text-slate-700">{title}</p>
    </div>
  );
}