import Link from "next/link";
import { redirect } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { gradeLabels, type Grade } from "@/lib/grade";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementsBlock } from "@/components/student/AnnouncementsBlock";


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
  subject_id: string;
};

type Entry = {
  id: string;
  title: string;
  slug: string;
  topic_id: string;
};

type Progress = {
  entry_id: string;
  current_step:
    | "video"
    | "reading"
    | "questions"
    | "examples"
    | "exercises"
    | "completed";
  completed_at: string | null;
};

type Profile = {
  role: "student" | "admin";
  first_name: string | null;
  first_last_name: string | null;
  grade: Grade | null;
  accepted_privacy_notice_at: string | null;
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

type SubjectProgress = {
  subject: Subject;
  totalEntries: number;
  completedEntries: number;
  percent: number;
};

function getRecommendedLevelName(profile: Profile) {
  if (!profile.levels) return "Nivel recomendado";

  if (Array.isArray(profile.levels)) {
    return profile.levels[0]?.name ?? "Nivel recomendado";
  }

  return profile.levels.name;
}

function calculatePercent(completed: number, total: number) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

function getSubjectProgressColor(percent: number) {
  if (percent >= 100) return "bg-green-600";
  if (percent > 0) return "bg-[#1F2E67]";
  return "bg-slate-300";
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select(
      `
      role,
      first_name,
      first_last_name,
      grade,
      accepted_privacy_notice_at,
      levels:recommended_level_id (
        name,
        slug
      )
    `
    )
    .eq("id", user.id)
    .single();

  const profile = profileData as Profile | null;

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  if (!profile?.accepted_privacy_notice_at) {
    redirect("/onboarding");
  }

  const { data: subjectsData } = await supabase
    .from("subjects")
    .select("id, name, slug, color")
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
          .select("entry_id, current_step, completed_at")
          .eq("student_id", user.id)
          .in("entry_id", entryIds)
      : { data: [] };

  const progressList = (progressData ?? []) as Progress[];

  const progressByEntryId = new Map<string, Progress>(
    progressList.map((progress) => [progress.entry_id, progress])
  );

  const completedEntries = progressList.filter(
    (progress) => progress.current_step === "completed"
  ).length;

  const totalEntries = entries.length;
  const generalPercent = calculatePercent(completedEntries, totalEntries);

  const subjectProgressList: SubjectProgress[] = subjects.map((subject) => {
    const subjectTopicIds = topics
      .filter((topic) => topic.subject_id === subject.id)
      .map((topic) => topic.id);

    const subjectEntries = entries.filter((entry) =>
      subjectTopicIds.includes(entry.topic_id)
    );

    const completedSubjectEntries = subjectEntries.filter((entry) => {
      const progress = progressByEntryId.get(entry.id);
      return progress?.current_step === "completed";
    });

    return {
      subject,
      totalEntries: subjectEntries.length,
      completedEntries: completedSubjectEntries.length,
      percent: calculatePercent(
        completedSubjectEntries.length,
        subjectEntries.length
      ),
    };
  });

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
            Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
            Hola, {profile.first_name ?? "estudiante"}
          </h1>

          <p className="mt-3 text-slate-600">
            Tu nivel recomendado es{" "}
            <span className="font-semibold text-[#1F2E67]">
              {getRecommendedLevelName(profile)}
            </span>
            .
          </p>

          {profile.grade ? (
            <p className="mt-1 text-sm text-slate-500">
              Grado registrado: {gradeLabels[profile.grade]}
            </p>
          ) : null}
        </div>

        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Avance general
            </p>

            <p className="mt-3 text-4xl font-bold text-[#1F2E67]">
              {generalPercent}%
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {completedEntries} de {totalEntries} entradas completadas.
            </p>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#1F2E67]"
                style={{ width: `${generalPercent}%` }}
              />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Ruta sugerida
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Puedes estudiar cualquier materia, pero te recomendamos avanzar
              primero en los temas de tu nivel. La plataforma guardará tu avance
              para que puedas continuar después.
            </p>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-4 text-xl font-bold text-slate-950">Materias</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {subjectProgressList.map(
              ({ subject, totalEntries, completedEntries, percent }) => (
                <Link
                  key={subject.slug}
                  href={`/materias/${subject.slug}`}
                  className="group rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1F2E67]/30"
                >
                  <div
                    className="mb-4 h-2 w-16 rounded-full"
                    style={{ backgroundColor: subject.color ?? "#1F2E67" }}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-slate-950 group-hover:text-[#1F2E67]">
                      {subject.name}
                    </h3>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {percent}%
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    {completedEntries} de {totalEntries} entradas completadas.
                  </p>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${getSubjectProgressColor(
                        percent
                      )}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-[#1F2E67]">
                    Ver materia →
                  </p>
                </Link>
              )
            )}
          </div>
        </section>

<AnnouncementsBlock />

<AdSlot placement="dashboard-bottom" />
      </section>
    </main>
  );
}