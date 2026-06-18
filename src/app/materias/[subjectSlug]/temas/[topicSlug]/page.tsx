import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ProgressStep =
  | "video"
  | "reading"
  | "questions"
  | "examples"
  | "exercises"
  | "completed";

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
  student_visible: boolean;
};

type Entry = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  order_index: number;
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

type Profile = {
  role: "student" | "admin";
  accepted_privacy_notice_at: string | null;
  recommended_level_id: string | null;
};

type EntryProgress = {
  entry_id: string;
  current_step: ProgressStep;
  completed_at: string | null;
  last_seen_at: string | null;
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

function getLevelName(entry: Entry) {
  if (!entry.levels) return "Nivel";

  if (Array.isArray(entry.levels)) {
    return entry.levels[0]?.name ?? "Nivel";
  }

  return entry.levels.name;
}

function getProgressLabel(progress?: EntryProgress) {
  if (!progress) return "Sin iniciar";

  if (progress.current_step === "completed") {
    return "Completada";
  }

  return `Continuar en: ${stepLabels[progress.current_step]}`;
}

function getButtonLabel(progress?: EntryProgress) {
  if (!progress) return "Iniciar entrada";

  if (progress.current_step === "completed") {
    return "Repasar entrada";
  }

  return "Continuar entrada";
}

function getBadgeClass(progress?: EntryProgress) {
  if (!progress) {
    return "bg-slate-100 text-slate-600";
  }

  if (progress.current_step === "completed") {
    return "bg-green-50 text-green-700";
  }

  return "bg-blue-50 text-[#1F2E67]";
}

export default async function StudentTopicPage({
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

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role, accepted_privacy_notice_at, recommended_level_id")
    .eq("id", user.id)
    .single();

  const profile = profileData as Profile | null;

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  if (!profile?.accepted_privacy_notice_at) {
    redirect("/onboarding");
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
    .select("id, title, slug, description, student_visible")
    .eq("subject_id", subject.id)
    .eq("slug", topicSlug)
    .eq("is_active", true)
    .single();

  const topic = topicData as Topic | null;

  if (!topic) {
    notFound();
  }

  if (!topic.student_visible) {
    notFound();
  }

  const { data: entriesData } = await supabase
    .from("entries")
    .select(
      `
      id,
      title,
      slug,
      summary,
      order_index,
      levels:level_id (
        name,
        slug
      )
    `
    )
    .eq("topic_id", topic.id)
    .eq("status", "published")
    .order("order_index", { ascending: true });

  const entries = (entriesData ?? []) as Entry[];
  const entryIds = entries.map((entry) => entry.id);

  const { data: progressData } =
    entryIds.length > 0
      ? await supabase
          .from("student_entry_progress")
          .select("entry_id, current_step, completed_at, last_seen_at")
          .eq("student_id", user.id)
          .in("entry_id", entryIds)
      : { data: [] };

  const progressList = (progressData ?? []) as EntryProgress[];

  const progressByEntryId = new Map<string, EntryProgress>(
    progressList.map((progress) => [progress.entry_id, progress])
  );

  const completedCount = progressList.filter(
    (progress) => progress.current_step === "completed"
  ).length;

  const totalEntries = entries.length;

  const topicProgressPercent =
    totalEntries === 0
      ? 0
      : Math.round((completedCount / totalEntries) * 100);

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <Link
            href={`/materias/${subject.slug}`}
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
              "Selecciona una entrada disponible para estudiar este tema."}
          </p>

          {totalEntries > 0 ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-700">
                  Avance del tema
                </p>

                <p className="text-sm font-semibold text-[#1F2E67]">
                  {completedCount} de {totalEntries} entradas completadas
                </p>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[#1F2E67]"
                  style={{ width: `${topicProgressPercent}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                {topicProgressPercent}% completado
              </p>
            </div>
          ) : null}
        </div>

        <section className="mt-6">
          <h2 className="mb-4 text-xl font-bold text-slate-950">
            Entradas disponibles
          </h2>

          {entries.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-slate-600 shadow-sm">
              Todavía no hay entradas disponibles para este tema.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {entries.map((entry) => {
                const progress = progressByEntryId.get(entry.id);
                const progressValue = progress
                  ? stepProgress[progress.current_step]
                  : 0;

                const entryUrl = `/materias/${subject.slug}/temas/${topic.slug}/entradas/${entry.slug}`;

                return (
                  <article
                    key={entry.id}
                    className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-950">
                        {entry.title}
                      </h3>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {getLevelName(entry)}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {entry.summary ?? "Entrada de estudio disponible."}
                    </p>

                    <div className="mt-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClass(
                          progress
                        )}`}
                      >
                        {getProgressLabel(progress)}
                      </span>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          progress?.current_step === "completed"
                            ? "bg-green-600"
                            : "bg-[#1F2E67]"
                        }`}
                        style={{ width: `${progressValue}%` }}
                      />
                    </div>

                    <a
                      href={entryUrl}
                      className="mt-5 inline-flex rounded-2xl bg-[#1F2E67] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      {getButtonLabel(progress)} →
                    </a>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}