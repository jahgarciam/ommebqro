import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gradeLabels, type Grade } from "@/lib/grade";

type Student = {
  id: string;
  email: string | null;
  first_name: string | null;
  first_last_name: string | null;
  grade: Grade | null;
  created_at: string;
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
};

type Subject = {
  id: string;
  name: string;
  slug: string;
};

type Topic = {
  id: string;
  title: string;
  slug: string;
  subject_id: string;
};

type Entry = {
  id: string;
  title: string;
  slug: string;
  topic_id: string;
};

type ProgressStep =
  | "video"
  | "reading"
  | "questions"
  | "examples"
  | "exercises"
  | "completed";

type Progress = {
  entry_id: string;
  current_step: ProgressStep;
  completed_at: string | null;
  last_seen_at: string | null;
};

type Question = {
  id: string;
  entry_id: string;
};

type Answer = {
  entry_id: string;
  question_id: string;
  is_correct: boolean;
  answered_at: string;
};

const stepLabels: Record<ProgressStep, string> = {
  video: "Video",
  reading: "Lectura",
  questions: "Preguntas",
  examples: "Ejemplos",
  exercises: "Ejercicios",
  completed: "Completada",
};

const stepProgress: Record<ProgressStep, number> = {
  video: 0,
  reading: 20,
  questions: 40,
  examples: 60,
  exercises: 80,
  completed: 100,
};

function getStudentName(student: Student) {
  const firstName = student.first_name?.trim();
  const firstLastName = student.first_last_name?.trim();

  if (firstName || firstLastName) {
    return [firstName, firstLastName].filter(Boolean).join(" ");
  }

  return student.email ?? "Alumno sin nombre";
}

function getLevelName(student: Student) {
  if (!student.levels) return "Nivel no asignado";

  if (Array.isArray(student.levels)) {
    return student.levels[0]?.name ?? "Nivel no asignado";
  }

  return student.levels.name;
}

function calculatePercent(completed: number, total: number) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

function formatDate(value: string | null) {
  if (!value) return "Sin actividad";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(progress?: Progress) {
  if (!progress) return "Sin iniciar";
  if (progress.current_step === "completed") return "Completada";
  return `En progreso: ${stepLabels[progress.current_step]}`;
}

function getStatusClass(progress?: Progress) {
  if (!progress) return "bg-slate-100 text-slate-600";
  if (progress.current_step === "completed") return "bg-green-50 text-green-700";
  return "bg-blue-50 text-[#1F2E67]";
}

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: studentData } = await supabase
    .from("profiles")
    .select(
      `
      id,
      email,
      first_name,
      first_last_name,
      grade,
      created_at,
      levels:recommended_level_id (
        name,
        slug
      )
    `
    )
    .eq("id", studentId)
    .eq("role", "student")
    .single();

  const student = studentData as Student | null;

  if (!student) {
    notFound();
  }

  const { data: subjectsData } = await supabase
    .from("subjects")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  const subjects = (subjectsData ?? []) as Subject[];
  const subjectIds = subjects.map((subject) => subject.id);

  const { data: topicsData } =
    subjectIds.length > 0
      ? await supabase
          .from("topics")
          .select("id, title, slug, subject_id")
          .eq("is_active", true)
          .in("subject_id", subjectIds)
      : { data: [] };

  const topics = (topicsData ?? []) as Topic[];
  const topicIds = topics.map((topic) => topic.id);

  const { data: entriesData } =
    topicIds.length > 0
      ? await supabase
          .from("entries")
          .select("id, title, slug, topic_id")
          .eq("status", "published")
          .in("topic_id", topicIds)
      : { data: [] };

  const entries = (entriesData ?? []) as Entry[];
  const entryIds = entries.map((entry) => entry.id);

  const { data: progressData } =
    entryIds.length > 0
      ? await supabase
          .from("student_entry_progress")
          .select("entry_id, current_step, completed_at, last_seen_at")
          .eq("student_id", student.id)
          .in("entry_id", entryIds)
      : { data: [] };

  const progressList = (progressData ?? []) as Progress[];

  const { data: questionsData } =
    entryIds.length > 0
      ? await supabase
          .from("quiz_questions")
          .select("id, entry_id")
          .eq("is_active", true)
          .in("entry_id", entryIds)
      : { data: [] };

  const questions = (questionsData ?? []) as Question[];

  const { data: answersData } =
    entryIds.length > 0
      ? await supabase
          .from("student_question_answers")
          .select("entry_id, question_id, is_correct, answered_at")
          .eq("student_id", student.id)
          .in("entry_id", entryIds)
      : { data: [] };

  const answers = (answersData ?? []) as Answer[];

  const topicById = new Map<string, Topic>(
    topics.map((topic) => [topic.id, topic])
  );

  const subjectById = new Map<string, Subject>(
    subjects.map((subject) => [subject.id, subject])
  );

  const progressByEntryId = new Map<string, Progress>(
    progressList.map((progress) => [progress.entry_id, progress])
  );

  const questionsByEntryId = new Map<string, Question[]>();

  for (const question of questions) {
    const current = questionsByEntryId.get(question.entry_id) ?? [];
    current.push(question);
    questionsByEntryId.set(question.entry_id, current);
  }

  const answersByEntryId = new Map<string, Answer[]>();

  for (const answer of answers) {
    const current = answersByEntryId.get(answer.entry_id) ?? [];
    current.push(answer);
    answersByEntryId.set(answer.entry_id, current);
  }

  const completedEntries = progressList.filter(
    (progress) => progress.current_step === "completed"
  ).length;

  const inProgressEntries = progressList.filter(
    (progress) => progress.current_step !== "completed"
  ).length;

  const totalEntries = entries.length;
  const generalPercent = calculatePercent(completedEntries, totalEntries);

  const lastProgress = [...progressList]
    .filter((progress) => progress.last_seen_at)
    .sort((a, b) => {
      const dateA = new Date(a.last_seen_at ?? 0).getTime();
      const dateB = new Date(b.last_seen_at ?? 0).getTime();
      return dateB - dateA;
    })[0];

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <Link
            href="/admin/alumnos"
            className="text-sm font-semibold text-[#1F2E67]"
          >
            ← Volver a alumnos
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
            Seguimiento individual
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
            {getStudentName(student)}
          </h1>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {student.email ?? "Sin correo"}
            </span>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1F2E67]">
              {getLevelName(student)}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {student.grade ? gradeLabels[student.grade] : "Sin grado"}
            </span>
          </div>
        </div>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <SummaryCard label="Avance general" value={`${generalPercent}%`} />
          <SummaryCard label="Completadas" value={completedEntries} />
          <SummaryCard label="En progreso" value={inProgressEntries} />
          <SummaryCard
            label="Última actividad"
            value={formatDate(lastProgress?.last_seen_at ?? null)}
          />
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Entradas publicadas
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Revisión del avance de este alumno en cada entrada disponible.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {completedEntries} de {totalEntries} completadas
            </span>
          </div>

          {entries.length === 0 ? (
            <p className="mt-5 text-sm text-slate-600">
              Todavía no hay entradas publicadas.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[1000px] border-separate border-spacing-y-3 text-left">
                <thead>
                  <tr className="text-sm text-slate-500">
                    <th className="px-4 py-2">Entrada</th>
                    <th className="px-4 py-2">Materia</th>
                    <th className="px-4 py-2">Tema</th>
                    <th className="px-4 py-2">Estado</th>
                    <th className="px-4 py-2">Avance</th>
                    <th className="px-4 py-2">Comprensión</th>
                    <th className="px-4 py-2">Última actividad</th>
                  </tr>
                </thead>

                <tbody>
                  {entries.map((entry) => {
                    const topic = topicById.get(entry.topic_id);
                    const subject = topic
                      ? subjectById.get(topic.subject_id)
                      : null;

                    const progress = progressByEntryId.get(entry.id);
                    const progressPercent = progress
                      ? stepProgress[progress.current_step]
                      : 0;

                    const entryQuestions = questionsByEntryId.get(entry.id) ?? [];
                    const entryAnswers = answersByEntryId.get(entry.id) ?? [];
                    const correctAnswers = entryAnswers.filter(
                      (answer) => answer.is_correct
                    ).length;

                    const comprehensionPercent = calculatePercent(
                      correctAnswers,
                      entryQuestions.length
                    );

                    return (
                      <tr key={entry.id}>
                        <td className="rounded-l-2xl bg-slate-50 px-4 py-4">
                          <p className="font-semibold text-slate-950">
                            {entry.title}
                          </p>
                        </td>

                        <td className="bg-slate-50 px-4 py-4 text-sm text-slate-600">
                          {subject?.name ?? "Sin materia"}
                        </td>

                        <td className="bg-slate-50 px-4 py-4 text-sm text-slate-600">
                          {topic?.title ?? "Sin tema"}
                        </td>

                        <td className="bg-slate-50 px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                              progress
                            )}`}
                          >
                            {getStatusLabel(progress)}
                          </span>
                        </td>

                        <td className="bg-slate-50 px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-white">
                              <div
                                className={`h-full rounded-full ${
                                  progress?.current_step === "completed"
                                    ? "bg-green-600"
                                    : "bg-[#1F2E67]"
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>

                            <span className="text-sm font-semibold text-slate-700">
                              {progressPercent}%
                            </span>
                          </div>
                        </td>

                        <td className="bg-slate-50 px-4 py-4">
                          {entryQuestions.length === 0 ? (
                            <span className="text-sm text-slate-500">
                              Sin preguntas
                            </span>
                          ) : entryAnswers.length === 0 ? (
                            <span className="text-sm text-slate-500">
                              Sin responder
                            </span>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-slate-700">
                                {correctAnswers} de {entryQuestions.length}
                              </p>
                              <p className="text-xs text-slate-500">
                                {comprehensionPercent}% correcto
                              </p>
                            </>
                          )}
                        </td>

                        <td className="rounded-r-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                          {formatDate(progress?.last_seen_at ?? null)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-bold text-[#1F2E67]">{value}</p>
    </div>
  );
}