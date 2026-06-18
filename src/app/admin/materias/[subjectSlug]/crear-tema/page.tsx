import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createTopic } from "@/actions/topics";
import { createClient } from "@/lib/supabase/server";

type Subject = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
};

export default async function CreateTopicPage({
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

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <Link
          href={`/admin/materias/${subject.slug}`}
          className="text-sm font-semibold text-[#1F2E67]"
        >
          ← Volver a {subject.name}
        </Link>

        <div
          className="mt-6 h-2 w-24 rounded-full"
          style={{ backgroundColor: subject.color ?? "#1F2E67" }}
        />

        <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
          Crear tema
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Nuevo tema de {subject.name}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Crea un tema general. Después podrás agregar entradas dentro de ese
          tema, por ejemplo: Semejanza p1, Semejanza p2, Semejanza p3.
        </p>

        <form action={createTopic} className="mt-8 space-y-5">
          <input type="hidden" name="subjectId" value={subject.id} />
          <input type="hidden" name="subjectSlug" value={subject.slug} />

          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              Nombre del tema
            </label>

            <input
              id="title"
              name="title"
              required
              maxLength={120}
              placeholder="Ej. Semejanza"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              Descripción breve
            </label>

            <textarea
              id="description"
              name="description"
              maxLength={500}
              rows={4}
              placeholder="Describe brevemente qué se estudiará en este tema."
              className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-semibold text-slate-950">
              Dificultad por nivel
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Si este tema no aplica para un nivel, deja la opción en “No
              aplica”.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <DifficultySelect name="nivel1Difficulty" label="Nivel 1" />
              <DifficultySelect name="nivel2Difficulty" label="Nivel 2" />
              <DifficultySelect name="nivel3Difficulty" label="Nivel 3" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-[#1F2E67] px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Crear tema
          </button>
        </form>
      </section>
    </main>
  );
}

function DifficultySelect({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-slate-800"
      >
        {label}
      </label>

      <select
        id={name}
        name={name}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
      >
        <option value="">No aplica</option>
        <option value="inicial">Inicial</option>
        <option value="estatal">Estatal</option>
        <option value="nacional">Nacional</option>
      </select>
    </div>
  );
}