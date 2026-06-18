import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createEntry } from "@/actions/entries";
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
};

type Level = {
  id: string;
  name: string;
  slug: string;
};

export default async function CreateEntryPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, first_last_name")
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
    .select("id, title, slug, description")
    .eq("subject_id", subject.id)
    .eq("slug", topicSlug)
    .eq("is_active", true)
    .single();

  const topic = topicData as Topic | null;

  if (!topic) {
    notFound();
  }

  const { data: levelsData } = await supabase
    .from("levels")
    .select("id, name, slug")
    .order("order_index", { ascending: true });

  const levels = (levelsData ?? []) as Level[];

  const trainerDefaultName = [profile?.first_name, profile?.first_last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <Link
          href={`/admin/materias/${subject.slug}/temas/${topic.slug}`}
          className="text-sm font-semibold text-[#1F2E67]"
        >
          ← Volver a {topic.title}
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
          Crear entrada
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Nueva entrada para {topic.title}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Esta entrada será una unidad de estudio. Después agregaremos ejemplos,
          ejercicios y preguntas de cuestionario con pantallas propias.
        </p>

        <form action={createEntry} className="mt-8 space-y-6">
          <input type="hidden" name="subjectSlug" value={subject.slug} />
          <input type="hidden" name="topicId" value={topic.id} />
          <input type="hidden" name="topicSlug" value={topic.slug} />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="levelId"
                className="mb-2 block text-sm font-medium text-slate-800"
              >
                Nivel
              </label>

              <select
                id="levelId"
                name="levelId"
                required
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
              >
                <option value="">Selecciona nivel</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="estimatedMinutes"
                className="mb-2 block text-sm font-medium text-slate-800"
              >
                Tiempo estimado en minutos
              </label>

              <input
                id="estimatedMinutes"
                name="estimatedMinutes"
                type="number"
                min={1}
                max={180}
                defaultValue={20}
                required
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              Título de la entrada
            </label>

            <input
              id="title"
              name="title"
              required
              maxLength={140}
              placeholder="Ej. Semejanza p1"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
          </div>

          <div>
            <label
              htmlFor="summary"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              Resumen breve
            </label>

            <textarea
              id="summary"
              name="summary"
              rows={3}
              maxLength={500}
              placeholder="Describe brevemente qué aprenderá el alumno en esta entrada."
              className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-semibold text-slate-950">
              Video y canal del entrenador
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Pega únicamente enlaces de YouTube. No pegues código iframe ni
              HTML.
            </p>

            <div className="mt-4 space-y-5">
              <div>
                <label
                  htmlFor="youtubeUrl"
                  className="mb-2 block text-sm font-medium text-slate-800"
                >
                  URL del video de YouTube
                </label>

                <input
                  id="youtubeUrl"
                  name="youtubeUrl"
                  type="url"
                  required
                  placeholder="https://youtu.be/..."
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="trainerName"
                    className="mb-2 block text-sm font-medium text-slate-800"
                  >
                    Nombre del entrenador
                  </label>

                  <input
                    id="trainerName"
                    name="trainerName"
                    required
                    defaultValue={trainerDefaultName}
                    maxLength={80}
                    placeholder="Ej. Jorge García"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="channelName"
                    className="mb-2 block text-sm font-medium text-slate-800"
                  >
                    Nombre del canal
                  </label>

                  <input
                    id="channelName"
                    name="channelName"
                    required
                    maxLength={100}
                    placeholder="Ej. IQmat"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="channelUrl"
                  className="mb-2 block text-sm font-medium text-slate-800"
                >
                  URL del canal de YouTube
                </label>

                <input
                  id="channelUrl"
                  name="channelUrl"
                  type="url"
                  required
                  placeholder="https://www.youtube.com/@tu-canal"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="readingContent"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              Lectura
            </label>

            <textarea
              id="readingContent"
              name="readingContent"
              rows={10}
              required
              placeholder={`Escribe aquí la lectura. Puedes usar Markdown y LaTeX.

Usa $...$ para fórmulas en línea:

La razón de semejanza es $k=2$.

Usa $$...$$ para ecuaciones centradas:

$$
3 \\cdot 2 = 6
$$

Para diagramas, TikZ o figuras geométricas, conviene subir una imagen en la sección de ejemplos.`}
              className="w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-950 placeholder:text-slate-500 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              Estado
            </label>

            <select
              id="status"
              name="status"
              required
              defaultValue="draft"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </select>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Usa “Borrador” mientras estés probando. Publicado hará visible la
              entrada para alumnos cuando exista la vista de alumno.
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-[#1F2E67] px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Crear entrada
          </button>
        </form>
      </section>
    </main>
  );
}