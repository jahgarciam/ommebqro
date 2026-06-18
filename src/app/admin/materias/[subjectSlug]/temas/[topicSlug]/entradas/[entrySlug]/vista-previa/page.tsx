import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MarkdownMath } from "@/components/markdown/MarkdownMath";
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
  summary: string | null;
  youtube_video_id: string | null;
  reading_content: string | null;
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

type QuizOption = {
  id: string;
  option_text: string;
  order_index: number;
};

type Question = {
  id: string;
  question_text: string;
  explanation: string | null;
  order_index: number;
  quiz_options: QuizOption[] | null;
};

type CorrectOption = {
  question_id: string;
  option_id: string;
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

type ExampleWithImageUrl = Example & {
  image_url: string | null;
};

function getTrainer(entry: Entry) {
  if (!entry.trainer_channels) return null;

  if (Array.isArray(entry.trainer_channels)) {
    return entry.trainer_channels[0] ?? null;
  }

  return entry.trainer_channels;
}

function getCorrectOptionId(
  questionId: string,
  correctOptions: CorrectOption[]
) {
  return (
    correctOptions.find((correct) => correct.question_id === questionId)
      ?.option_id ?? null
  );
}

export default async function AdminStudentPreviewPage({
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
    .select(
      `
      id,
      title,
      slug,
      summary,
      youtube_video_id,
      reading_content,
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
    .select(
      `
      id,
      question_text,
      explanation,
      order_index,
      quiz_options (
        id,
        option_text,
        order_index
      )
    `
    )
    .eq("entry_id", entry.id)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  const questions = ((questionsData ?? []) as Question[]).map((question) => ({
    ...question,
    quiz_options: [...(question.quiz_options ?? [])].sort(
      (a, b) => a.order_index - b.order_index
    ),
  }));

  const { data: correctOptionsData } = await supabase
    .from("quiz_correct_options")
    .select("question_id, option_id")
    .in(
      "question_id",
      questions.map((question) => question.id)
    );

  const correctOptions = (correctOptionsData ?? []) as CorrectOption[];

  const { data: examplesData } = await supabase
    .from("examples")
    .select("id, title, content, image_path, image_alt, order_index")
    .eq("entry_id", entry.id)
    .order("order_index", { ascending: true });

  const examples = (examplesData ?? []) as Example[];

  const examplesWithImages: ExampleWithImageUrl[] = await Promise.all(
    examples.map(async (example) => {
      if (!example.image_path) {
        return {
          ...example,
          image_url: null,
        };
      }

      const { data } = await supabase.storage
        .from("learning-assets")
        .createSignedUrl(example.image_path, 60 * 60);

      return {
        ...example,
        image_url: data?.signedUrl ?? null,
      };
    })
  );

  const { data: exercisesData } = await supabase
    .from("proposed_exercises")
    .select(
      "id, statement, hint_1, hint_2, hint_3, solution_content, order_index"
    )
    .eq("entry_id", entry.id)
    .order("order_index", { ascending: true });

  const exercises = (exercisesData ?? []) as Exercise[];
  const trainer = getTrainer(entry);

  const backUrl = `/admin/materias/${subject.slug}/temas/${topic.slug}/entradas/${entry.slug}`;

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-[#1F2E67]/20 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Link href={backUrl} className="text-sm font-semibold text-[#1F2E67]">
                ← Volver a edición
              </Link>

              <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
                Vista previa como alumno
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
                {entry.title}
              </h1>

              {entry.summary ? (
                <p className="mt-3 max-w-3xl text-slate-600">
                  {entry.summary}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              Esta vista no guarda avance.
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <PreviewSection number="1" title="Video">
            {trainer ? (
              <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                  Este video fue preparado por{" "}
                  <span className="font-semibold text-slate-950">
                    {trainer.trainer_name}
                  </span>
                  .
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Canal:{" "}
                  <span className="font-semibold text-slate-950">
                    {trainer.channel_name}
                  </span>
                </p>

                <a
                  href={trainer.youtube_channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex text-sm font-semibold text-[#1F2E67]"
                >
                  Visitar canal →
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
            ) : (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                Esta entrada aún no tiene video.
              </p>
            )}
          </PreviewSection>

          <PreviewSection number="2" title="Lectura">
            {entry.reading_content ? (
              <div className="prose prose-slate max-w-none">
                <MarkdownMath content={entry.reading_content} />
              </div>
            ) : (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                Esta entrada aún no tiene lectura.
              </p>
            )}
          </PreviewSection>

          <PreviewSection number="3" title="Preguntas de comprensión">
            {questions.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                Esta entrada aún no tiene preguntas.
              </p>
            ) : (
              <div className="space-y-4">
                {questions.map((question, questionIndex) => {
                  const correctOptionId = getCorrectOptionId(
                    question.id,
                    correctOptions
                  );

                  return (
                    <div
                      key={question.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <p className="text-sm font-semibold text-[#1F2E67]">
                        Pregunta {questionIndex + 1}
                      </p>

                      <div className="mt-2 text-slate-800">
                        <MarkdownMath content={question.question_text} />
                      </div>

                      <div className="mt-4 space-y-2">
                        {(question.quiz_options ?? []).map(
                          (option, optionIndex) => {
                            const letter = ["A", "B", "C", "D"][optionIndex];
                            const isCorrect = option.id === correctOptionId;

                            return (
                              <div
                                key={option.id}
                                className={
                                  isCorrect
                                    ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-3"
                                    : "rounded-2xl border border-slate-200 bg-white p-3"
                                }
                              >
                                <div className="flex gap-3">
                                  <span className="font-semibold text-slate-700">
                                    {letter}.
                                  </span>

                                  <div className="text-sm text-slate-700">
                                    <MarkdownMath content={option.option_text} />
                                  </div>

                                  {isCorrect ? (
                                    <span className="ml-auto rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                                      Correcta
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>

                      {question.explanation ? (
                        <div className="mt-4 rounded-2xl bg-blue-50 p-3 text-sm text-[#1F2E67]">
                          <p className="font-semibold">Retroalimentación</p>
                          <div className="mt-1">
                            <MarkdownMath content={question.explanation} />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </PreviewSection>

          <PreviewSection number="4" title="Ejemplos resueltos">
            {examplesWithImages.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                Esta entrada aún no tiene ejemplos.
              </p>
            ) : (
              <div className="space-y-4">
                {examplesWithImages.map((example, index) => (
                  <div
                    key={example.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <p className="text-sm font-semibold text-[#1F2E67]">
                      Ejemplo {index + 1}
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-slate-950">
                      {example.title}
                    </h3>

                    {example.image_url ? (
                      <img
                        src={example.image_url}
                        alt={example.image_alt ?? example.title}
                        className="mt-4 max-h-96 rounded-2xl border border-slate-200 object-contain"
                      />
                    ) : null}

                    <div className="prose prose-slate mt-4 max-w-none">
                      <MarkdownMath content={example.content} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PreviewSection>

          <PreviewSection number="5" title="Ejercicios propuestos">
            {exercises.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                Esta entrada aún no tiene ejercicios.
              </p>
            ) : (
              <div className="space-y-4">
                {exercises.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <p className="text-sm font-semibold text-[#1F2E67]">
                      Ejercicio {index + 1}
                    </p>

                    <div className="mt-2 text-slate-800">
                      <MarkdownMath content={exercise.statement} />
                    </div>

                    {exercise.hint_1 || exercise.hint_2 || exercise.hint_3 ? (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-700">
                          Pistas
                        </p>

                        <div className="mt-2 space-y-2 text-sm text-slate-600">
                          {exercise.hint_1 ? (
                            <p>
                              <span className="font-semibold">Pista 1:</span>{" "}
                              {exercise.hint_1}
                            </p>
                          ) : null}

                          {exercise.hint_2 ? (
                            <p>
                              <span className="font-semibold">Pista 2:</span>{" "}
                              {exercise.hint_2}
                            </p>
                          ) : null}

                          {exercise.hint_3 ? (
                            <p>
                              <span className="font-semibold">Pista 3:</span>{" "}
                              {exercise.hint_3}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {exercise.solution_content ? (
                      <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-[#1F2E67]">
                        <p className="font-semibold">Solución o comentario final</p>
                        <div className="mt-2">
                          <MarkdownMath content={exercise.solution_content} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </PreviewSection>
        </div>
      </section>
    </main>
  );
}

function PreviewSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1F2E67] text-sm font-bold text-white">
          {number}
        </span>

        <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
      </div>

      {children}
    </section>
  );
}