import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EntryPlayer } from "@/components/student/EntryPlayer";
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
};

type Topic = {
  id: string;
  title: string;
  slug: string;
  student_visible: boolean;
};

type Entry = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  youtube_video_id: string | null;
  reading_content: string | null;
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
  order_index: number;
  quiz_options:
    | {
        id: string;
        option_text: string;
        order_index: number;
      }[]
    | null;
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
  order_index: number;
};

type StudentProgress = {
  current_step: ProgressStep;
} | null;

type StudentAnswer = {
  question_id: string;
  selected_option_id: string;
};

function getLevelName(entry: Entry) {
  if (!entry.levels) return "Nivel";

  if (Array.isArray(entry.levels)) {
    return entry.levels[0]?.name ?? "Nivel";
  }

  return entry.levels.name;
}

function getTrainer(entry: Entry) {
  if (!entry.trainer_channels) return null;

  if (Array.isArray(entry.trainer_channels)) {
    return entry.trainer_channels[0] ?? null;
  }

  return entry.trainer_channels;
}

export default async function StudentEntryPage({
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
    .select("role, accepted_privacy_notice_at")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  if (!profile?.accepted_privacy_notice_at) {
    redirect("/onboarding");
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
    .select("id, title, slug, student_visible")
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
    .eq("status", "published")
    .single();

  const entry = entryData as Entry | null;

  if (!entry) {
    notFound();
  }

  const { data: progressData } = await supabase
    .from("student_entry_progress")
    .select("current_step")
    .eq("student_id", user.id)
    .eq("entry_id", entry.id)
    .maybeSingle();

  const progress = progressData as StudentProgress;

  const { data: answersData } = await supabase
    .from("student_question_answers")
    .select("question_id, selected_option_id")
    .eq("student_id", user.id)
    .eq("entry_id", entry.id);

  const answers = (answersData ?? []) as StudentAnswer[];

  const initialSelectedAnswers = answers.reduce<Record<string, string>>(
    (accumulator, answer) => {
      accumulator[answer.question_id] = answer.selected_option_id;
      return accumulator;
    },
    {}
  );

  const { data: questionsData } = await supabase
    .from("quiz_questions")
    .select(
      `
      id,
      question_text,
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

  const questions = (questionsData ?? []) as Question[];

  const { data: examplesData } = await supabase
    .from("examples")
    .select("id, title, content, image_path, image_alt, order_index")
    .eq("entry_id", entry.id)
    .order("order_index", { ascending: true });

  const examples = (examplesData ?? []) as Example[];

  const examplesWithUrls = [];

  for (const example of examples) {
    let imageUrl: string | null = null;

    if (example.image_path) {
      const { data } = await supabase.storage
        .from("learning-assets")
        .createSignedUrl(example.image_path, 60 * 60);

      imageUrl = data?.signedUrl ?? null;
    }

    examplesWithUrls.push({
      id: example.id,
      title: example.title,
      content: example.content,
      image_url: imageUrl,
      image_alt: example.image_alt,
      order_index: example.order_index,
    });
  }

  const { data: exercisesData } = await supabase
    .from("proposed_exercises")
    .select("id, statement, hint_1, hint_2, hint_3, order_index")
    .eq("entry_id", entry.id)
    .order("order_index", { ascending: true });

  const exercises = (exercisesData ?? []) as Exercise[];
  const trainer = getTrainer(entry);

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <article className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href={`/materias/${subject.slug}/temas/${topic.slug}`}
            className="text-sm font-semibold text-[#1F2E67]"
          >
            ← Volver a las entradas de {topic.title}
          </Link>
        </div>

        <EntryPlayer
          entryId={entry.id}
          title={entry.title}
          summary={entry.summary}
          youtubeVideoId={entry.youtube_video_id}
          readingContent={entry.reading_content ?? ""}
          trainer={trainer}
          questions={questions}
          examples={examplesWithUrls}
          exercises={exercises}
          initialStep={progress?.current_step ?? "video"}
          initialSelectedAnswers={initialSelectedAnswers}
          returnUrl={`/materias/${subject.slug}/temas/${topic.slug}`}
        />

        <div className="mt-6 rounded-3xl bg-white p-5 text-sm text-slate-500 shadow-sm">
          {subject.name} · {getLevelName(entry)}
        </div>
      </article>
    </main>
  );
}