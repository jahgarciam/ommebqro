import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateReadingQuestion } from "@/actions/entry-content";
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

type QuizOption = {
  id: string;
  option_text: string;
  order_index: number;
};

type Question = {
  id: string;
  entry_id: string;
  question_text: string;
  explanation: string | null;
  quiz_options: QuizOption[] | null;
};

type CorrectOption = {
  option_id: string;
};

function getErrorMessage(error?: string) {
  if (!error) return null;

  const messages: Record<string, string> = {
    "invalid-question-text": "La pregunta debe tener entre 5 y 1000 caracteres.",
    "invalid-options": "Todas las opciones deben tener texto.",
    "invalid-correct-option": "Selecciona una respuesta correcta válida.",
    "explanation-too-long": "La retroalimentación no debe superar 1500 caracteres.",
    "unsafe-content": "El contenido contiene HTML no permitido.",
    "update-question": "No se pudo actualizar la pregunta.",
    "update-option": "No se pudo actualizar una de las opciones.",
    "missing-option-id": "No se pudo identificar una de las opciones.",
    "update-correct-option": "No se pudo guardar la respuesta correcta.",
  };

  return messages[error] ?? `No se pudo actualizar la pregunta. Error: ${error}`;
}

function getOption(options: QuizOption[], orderIndex: number) {
  return options.find((option) => option.order_index === orderIndex) ?? null;
}

function getCorrectLetter(
  correctOptionId: string | null,
  optionA: QuizOption | null,
  optionB: QuizOption | null,
  optionC: QuizOption | null,
  optionD: QuizOption | null
) {
  if (correctOptionId === optionA?.id) return "A";
  if (correctOptionId === optionB?.id) return "B";
  if (correctOptionId === optionC?.id) return "C";
  if (correctOptionId === optionD?.id) return "D";

  return "A";
}

export default async function EditQuestionPage({
  params,
  searchParams,
}: {
  params: Promise<{
    subjectSlug: string;
    topicSlug: string;
    entrySlug: string;
    questionId: string;
  }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { subjectSlug, topicSlug, entrySlug, questionId } = await params;
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

  const { data: questionData } = await supabase
    .from("quiz_questions")
    .select(
      `
      id,
      entry_id,
      question_text,
      explanation,
      quiz_options (
        id,
        option_text,
        order_index
      )
    `
    )
    .eq("id", questionId)
    .eq("entry_id", entry.id)
    .single();

  const question = questionData as Question | null;

  if (!question) {
    notFound();
  }

  const options = [...(question.quiz_options ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  );

  const optionA = getOption(options, 1);
  const optionB = getOption(options, 2);
  const optionC = getOption(options, 3);
  const optionD = getOption(options, 4);

  if (!optionA || !optionB || !optionC || !optionD) {
    notFound();
  }

  const { data: correctData } = await supabase
    .from("quiz_correct_options")
    .select("option_id")
    .eq("question_id", question.id)
    .maybeSingle();

  const correctOption = correctData as CorrectOption | null;

  const correctLetter = getCorrectLetter(
    correctOption?.option_id ?? null,
    optionA,
    optionB,
    optionC,
    optionD
  );

  const backUrl = `/admin/materias/${subject.slug}/temas/${topic.slug}/entradas/${entry.slug}`;

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <Link href={backUrl} className="text-sm font-semibold text-[#1F2E67]">
            ← Volver a la entrada
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
            Editar pregunta
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
            {entry.title}
          </h1>

          <p className="mt-3 text-slate-600">
            Modifica la pregunta, sus opciones y la respuesta correcta.
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <form
          action={updateReadingQuestion}
          className="mt-6 space-y-5 rounded-3xl bg-white p-6 shadow-sm md:p-8"
        >
          <input type="hidden" name="subjectSlug" value={subject.slug} />
          <input type="hidden" name="topicSlug" value={topic.slug} />
          <input type="hidden" name="entrySlug" value={entry.slug} />
          <input type="hidden" name="entryId" value={entry.id} />
          <input type="hidden" name="questionId" value={question.id} />

          <input type="hidden" name="optionAId" value={optionA.id} />
          <input type="hidden" name="optionBId" value={optionB.id} />
          <input type="hidden" name="optionCId" value={optionC.id} />
          <input type="hidden" name="optionDId" value={optionD.id} />

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Pregunta
            </span>
            <textarea
              name="questionText"
              required
              rows={4}
              maxLength={1000}
              defaultValue={question.question_text}
              className="w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <OptionInput label="Opción A" name="optionA" value={optionA.option_text} />
            <OptionInput label="Opción B" name="optionB" value={optionB.option_text} />
            <OptionInput label="Opción C" name="optionC" value={optionC.option_text} />
            <OptionInput label="Opción D" name="optionD" value={optionD.option_text} />
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Respuesta correcta
            </span>
            <select
              name="correctOption"
              defaultValue={correctLetter}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Retroalimentación
            </span>
            <textarea
              name="explanation"
              rows={5}
              maxLength={1500}
              defaultValue={question.explanation ?? ""}
              className="w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
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

function OptionInput({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <input
        name={name}
        required
        maxLength={500}
        defaultValue={value}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
      />
    </label>
  );
}