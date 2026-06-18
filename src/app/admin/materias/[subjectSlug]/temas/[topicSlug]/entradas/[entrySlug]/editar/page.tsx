import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateEntryBase } from "@/actions/entries";
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
  youtube_url: string | null;
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

function getTrainer(entry: Entry) {
  if (!entry.trainer_channels) return null;

  if (Array.isArray(entry.trainer_channels)) {
    return entry.trainer_channels[0] ?? null;
  }

  return entry.trainer_channels;
}

function getYoutubeUrl(entry: Entry) {
  if (entry.youtube_url) {
    return entry.youtube_url;
  }

  if (entry.youtube_video_id) {
    return `https://www.youtube.com/watch?v=${entry.youtube_video_id}`;
  }

  return "";
}

function getErrorMessage(error?: string) {
  if (!error) return null;

  const messages: Record<string, string> = {
    "trainer-channel": "No se pudo guardar la información del canal.",
    "update-failed": "No se pudo actualizar la entrada.",
  };

  return messages[error] ?? `No se pudo guardar la entrada. Error: ${error}`;
}

export default async function EditEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{
    subjectSlug: string;
    topicSlug: string;
    entrySlug: string;
  }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { subjectSlug, topicSlug, entrySlug } = await params;
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
    .select(
      `
      id,
      title,
      slug,
      summary,
      youtube_url,
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

  const trainer = getTrainer(entry);

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <Link
            href={`/admin/materias/${subject.slug}/temas/${topic.slug}/entradas/${entry.slug}`}
            className="text-sm font-semibold text-[#1F2E67]"
          >
            ← Volver a la entrada
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
            Editar entrada
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
            {entry.title}
          </h1>

          <p className="mt-3 text-slate-600">
            Modifica la información general de la entrada. Las preguntas,
            ejemplos y ejercicios se editan desde la pantalla de alimentación.
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <form
          action={updateEntryBase}
          className="mt-6 space-y-5 rounded-3xl bg-white p-6 shadow-sm md:p-8"
        >
          <input type="hidden" name="subjectSlug" value={subject.slug} />
          <input type="hidden" name="topicSlug" value={topic.slug} />
          <input type="hidden" name="entryId" value={entry.id} />

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Título
            </span>
            <input
              name="title"
              required
              maxLength={140}
              defaultValue={entry.title}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Resumen
            </span>
            <textarea
              name="summary"
              rows={3}
              maxLength={500}
              defaultValue={entry.summary ?? ""}
              className="w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              URL del video de YouTube
            </span>
            <input
              name="youtubeUrl"
              required
              defaultValue={getYoutubeUrl(entry)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Nombre del entrenador
              </span>
              <input
                name="trainerName"
                required
                defaultValue={trainer?.trainer_name ?? ""}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Nombre del canal
              </span>
              <input
                name="channelName"
                required
                defaultValue={trainer?.channel_name ?? ""}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              URL del canal de YouTube
            </span>
            <input
              name="channelUrl"
              required
              defaultValue={trainer?.youtube_channel_url ?? ""}
              placeholder="https://www.youtube.com/@canal"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Lectura
            </span>
            <textarea
              name="readingContent"
              required
              rows={12}
              defaultValue={entry.reading_content ?? ""}
              className="w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
            <p className="mt-2 text-xs text-slate-500">
              Puedes usar Markdown y LaTeX con $...$ o $$...$$.
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
              href={`/admin/materias/${subject.slug}/temas/${topic.slug}/entradas/${entry.slug}`}
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