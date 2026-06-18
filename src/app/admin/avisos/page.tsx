import Link from "next/link";
import { redirect } from "next/navigation";
import { createAnnouncement, deleteAnnouncement } from "@/actions/announcements";
import { createClient } from "@/lib/supabase/server";

type Announcement = {
  id: string;
  title: string;
  body: string | null;
  file_path: string | null;
  file_mime_type: string | null;
  file_original_name: string | null;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getFileLabel(announcement: Announcement) {
  if (!announcement.file_path) return "Sin archivo";

  if (announcement.file_mime_type?.startsWith("image/")) {
    return "Imagen";
  }

  if (announcement.file_mime_type === "application/pdf") {
    return "PDF";
  }

  return "Archivo";
}

function getErrorMessage(error?: string) {
  if (!error) return null;

  const messages: Record<string, string> = {
    "invalid-title": "El título debe tener entre 3 y 120 caracteres.",
    "body-too-long": "El texto corto no debe superar los 800 caracteres.",
    "invalid-file-type": "El archivo debe ser PNG, JPG, WEBP o PDF.",
    "file-too-large": "El archivo no debe superar los 10 MB.",
    "upload-failed": "No se pudo subir el archivo.",
    "create-failed": "No se pudo crear el aviso.",
    "delete-failed": "No se pudo eliminar el aviso.",
    "invalid-delete": "No se pudo identificar el aviso a eliminar.",
    "profile-error": "No se pudo verificar el perfil de administrador.",
  };

  return messages[error] ?? `No se pudo guardar el aviso. Error: ${error}`;
}

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = getErrorMessage(params.error);

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

  const { data: announcementsData } = await supabase
    .from("announcements")
    .select(
      "id, title, body, file_path, file_mime_type, file_original_name, created_at"
    )
    .order("created_at", { ascending: false });

  const announcements = (announcementsData ?? []) as Announcement[];

  const announcementsWithUrls = announcements.map((announcement) => {
    const publicUrl = announcement.file_path
      ? supabase.storage
          .from("public-assets")
          .getPublicUrl(announcement.file_path).data.publicUrl
      : null;

    return {
      ...announcement,
      publicUrl,
    };
  });

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <Link href="/admin" className="text-sm font-semibold text-[#1F2E67]">
            ← Volver al panel admin
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
            Avisos
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
            Avisos y convocatorias
          </h1>

          <p className="mt-3 max-w-3xl text-slate-600">
            Publica avisos cortos, imágenes o convocatorias en PDF para que los
            alumnos los vean en su dashboard.
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {params.success ? (
          <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
            Aviso guardado correctamente.
          </div>
        ) : null}

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Crear aviso</h2>

            <form action={createAnnouncement} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Título
                </span>
                <input
                  name="title"
                  required
                  maxLength={120}
                  placeholder="Ej. Convocatoria abierta"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Texto corto
                </span>
                <textarea
                  name="body"
                  rows={5}
                  maxLength={800}
                  placeholder="Escribe un aviso breve para los alumnos."
                  className="w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Archivo opcional
                </span>
                <input
                  name="file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 file:mr-4 file:rounded-xl file:border-0 file:bg-[#1F2E67] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Formatos permitidos: PNG, JPG, WEBP o PDF. Máximo 10 MB.
                </p>
              </label>

              <button
                type="submit"
                className="w-full rounded-2xl bg-[#1F2E67] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Publicar aviso
              </button>
            </form>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Avisos publicados
            </h2>

            {announcementsWithUrls.length === 0 ? (
              <p className="mt-5 text-sm text-slate-600">
                Todavía no hay avisos publicados.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {announcementsWithUrls.map((announcement) => (
                  <article
                    key={announcement.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="font-bold text-slate-950">
                          {announcement.title}
                        </h3>

                        {announcement.body ? (
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {announcement.body}
                          </p>
                        ) : null}

                        <p className="mt-3 text-xs text-slate-500">
                          Publicado: {formatDate(announcement.created_at)}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-[#1F2E67]">
                          {getFileLabel(announcement)}
                          {announcement.file_original_name
                            ? ` · ${announcement.file_original_name}`
                            : ""}
                        </p>

                        {announcement.publicUrl ? (
                          <a
                            href={announcement.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex text-sm font-semibold text-[#1F2E67] hover:underline"
                          >
                            Ver archivo →
                          </a>
                        ) : null}
                      </div>

                      <form action={deleteAnnouncement}>
                        <input
                          type="hidden"
                          name="announcementId"
                          value={announcement.id}
                        />

                        <button
                          type="submit"
                          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}