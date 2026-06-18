import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
  order_index: number;
};

type Profile = {
  role: "student" | "admin";
  accepted_privacy_notice_at: string | null;
  recommended_level_id: string | null;
};

type TopicSetting = {
  topic_id: string;
  level_id: string;
  difficulty: "inicial" | "estatal" | "nacional";
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

function getLevelName(setting: TopicSetting) {
  if (!setting.levels) return "Nivel";

  if (Array.isArray(setting.levels)) {
    return setting.levels[0]?.name ?? "Nivel";
  }

  return setting.levels.name;
}

export default async function StudentSubjectPage({
  params,
}: {
  params: Promise<{ subjectSlug: string }>;
}) {
  const { subjectSlug } = await params;

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

  const { data: topicsData } = await supabase
    .from("topics")
    .select("id, title, slug, description, order_index")
    .eq("subject_id", subject.id)
    .eq("is_active", true)
    .eq("student_visible", true)
    .order("order_index", { ascending: true });

  const topics = (topicsData ?? []) as Topic[];
  const topicIds = topics.map((topic) => topic.id);

  const { data: settingsData } = topicIds.length
    ? await supabase
        .from("topic_level_settings")
        .select(
          `
          topic_id,
          level_id,
          difficulty,
          levels:level_id (
            name,
            slug
          )
        `
        )
        .in("topic_id", topicIds)
        .eq("is_visible", true)
        .order("order_index", { ascending: true })
    : { data: [] };

  const settings = (settingsData ?? []) as TopicSetting[];

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-[#1F2E67]"
          >
            ← Volver al dashboard
          </Link>

          <div
            className="mt-6 h-2 w-24 rounded-full"
            style={{ backgroundColor: subject.color ?? "#1F2E67" }}
          />

          <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
            Materia
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
            {subject.name}
          </h1>

          <p className="mt-3 max-w-3xl text-slate-600">
            Elige un tema para estudiar. Algunos temas pertenecen a tu nivel
            recomendado y otros están disponibles para explorar.
          </p>
        </div>

        <section className="mt-6">
          <h2 className="mb-4 text-xl font-bold text-slate-950">
            Temas disponibles
          </h2>

          {topics.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-slate-600 shadow-sm">
              Todavía no hay temas disponibles en esta materia.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {topics.map((topic) => {
                const topicSettings = settings.filter(
                  (setting) => setting.topic_id === topic.id
                );

                const appliesToStudent = topicSettings.some(
                  (setting) =>
                    setting.level_id === profile.recommended_level_id
                );

                return (
                  <Link
                    key={topic.id}
                    href={`/materias/${subject.slug}/temas/${topic.slug}`}
                    className="group rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1F2E67]/30"
                  >
                    <article>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-950 group-hover:text-[#1F2E67]">
                          {topic.title}
                        </h3>

                        {appliesToStudent ? (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1F2E67]">
                            Tu nivel
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {topic.description ??
                          "Entra para ver las entradas disponibles de este tema."}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {topicSettings.map((setting) => (
                          <span
                            key={`${setting.topic_id}-${setting.level_id}`}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                          >
                            {getLevelName(setting)} · {setting.difficulty}
                          </span>
                        ))}
                      </div>

                      <p className="mt-4 text-sm font-semibold text-[#1F2E67]">
                        Ver tema →
                      </p>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}