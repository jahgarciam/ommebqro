import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateExample } from "@/actions/entry-content";
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

type Example = {
  id: string;
  entry_id: string;
  title: string;
  content: string;
  image_path: string | null;
  image_alt: string | null;
};

function getErrorMessage(error?: string) {
  if (!error) return null;

  const messages: Record<string, string> = {
    "invalid-title": "El título debe tener entre 3 y 120 caracteres.",
    "invalid-content": "El desarrollo debe tener entre 3 y 20000 caracteres.",
    "image-alt-too-long": "La descripción de imagen no debe superar 200 caracteres.",
    "unsafe-content": "El contenido contiene HTML no permitido.",
    "image-type": "La imagen debe ser PNG, JPG o WEBP.",
    "image-size": "La imagen no debe superar 5 MB.",
    "image-upload": "No se pudo subir la imagen.",
    "update-example": "No se pudo actualizar el ejemplo.",
  };

  return messages[error] ?? `No se pudo actualizar el ejemplo. Error: ${error}`;
}

export default async function EditExamplePage({
  params,
  searchParams,
}: {
  params: Promise<{
    subjectSlug: string;
    topicSlug: string;
    entrySlug: string;
    exampleId: string;
  }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { subjectSlug, topicSlug, entrySlug, exampleId } = await params;
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

  const { data: exampleData } = await supabase
    .from("examples")
    .select("id, entry_id, title, content, image_path, image_alt")
    .eq("id", exampleId)
    .eq("entry_id", entry.id)
    .single();

  const example = exampleData as Example | null;

  if (!example) {
    notFound();
  }

  const imageUrl = example.image_path
    ? (
        await supabase.storage
          .from("learning-assets")
          .createSignedUrl(example.image_path, 60 * 60)
      ).data?.signedUrl ?? null
    : null;

  const backUrl = `/admin/materias/${subject.slug}/temas/${topic.slug}/entradas/${entry.slug}`;

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <Link href={backUrl} className="text-sm font-semibold text-[#1F2E67]">
            ← Volver a la entrada
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
            Editar ejemplo
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
            {example.title}
          </h1>

          <p className="mt-3 text-slate-600">
            Modifica el título, desarrollo paso a paso o imagen del ejemplo.
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <form
          action={updateExample}
          className="mt-6 space-y-5 rounded-3xl bg-white p-6 shadow-sm md:p-8"
        >
          <input type="hidden" name="subjectSlug" value={subject.slug} />
          <input type="hidden" name="topicSlug" value={topic.slug} />
          <input type="hidden" name="entrySlug" value={entry.slug} />
          <input type="hidden" name="entryId" value={entry.id} />
          <input type="hidden" name="exampleId" value={example.id} />

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Título del ejemplo
            </span>
            <input
              name="title"
              required
              maxLength={120}
              defaultValue={example.title}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Desarrollo paso a paso
            </span>
            <textarea
              name="content"
              required
              rows={12}
              defaultValue={example.content}
              className="w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
            />
            <p className="mt-2 text-xs text-slate-500">
              Puedes usar Markdown y LaTeX con $...$ o $$...$$.
            </p>
          </label>

          {imageUrl ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">
                Imagen actual
              </p>

              <img
                src={imageUrl}
                alt={example.image_alt ?? example.title}
                className="mt-3 max-h-72 rounded-2xl border border-slate-200 object-contain"
              />

              <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-red-700">
                <input
                  type="checkbox"
                  name="removeImage"
                  value="true"
                  className="h-4 w-4"
                />
                Quitar imagen actual
              </label>
            </div>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Reemplazar o agregar imagen
            </span>
            <input
              name="imageFile"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 file:mr-4 file:rounded-xl file:border-0 file:bg-[#1F2E67] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            <p className="mt-2 text-xs text-slate-500">
              Formatos permitidos: PNG, JPG o WEBP. Máximo 5 MB.
            </p>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Descripción de imagen
            </span>
            <input
              name="imageAlt"
              maxLength={200}
              defaultValue={example.image_alt ?? ""}
              placeholder="Ej. Diagrama de dos triángulos semejantes"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
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