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
  }).format(new Date(value));
}

export async function AnnouncementsBlock() {
  const supabase = await createClient();

  const { data: announcementsData } = await supabase
    .from("announcements")
    .select(
      "id, title, body, file_path, file_mime_type, file_original_name, created_at"
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(6);

  const announcements = (announcementsData ?? []) as Announcement[];

  if (announcements.length === 0) {
    return null;
  }

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
    <section className="mt-6">
      <h2 className="mb-4 text-xl font-bold text-slate-950">
        Avisos y convocatorias
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {announcementsWithUrls.map((announcement) => {
          const isImage = announcement.file_mime_type?.startsWith("image/");
          const isPdf = announcement.file_mime_type === "application/pdf";

          return (
            <article
              key={announcement.id}
              className="overflow-hidden rounded-3xl bg-white shadow-sm"
            >
              {isImage && announcement.publicUrl ? (
                <img
                  src={announcement.publicUrl}
                  alt={announcement.title}
                  className="h-56 w-full object-cover"
                />
              ) : null}

              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#1F2E67]">
                  {formatDate(announcement.created_at)}
                </p>

                <h3 className="mt-2 text-lg font-bold text-slate-950">
                  {announcement.title}
                </h3>

                {announcement.body ? (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {announcement.body}
                  </p>
                ) : null}

                {announcement.publicUrl ? (
                  <a
                    href={announcement.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex rounded-2xl bg-[#1F2E67] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    {isPdf ? "Abrir PDF" : "Ver archivo"} →
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}