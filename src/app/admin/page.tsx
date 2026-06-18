import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Subject = {
  name: string;
  slug: string;
  color: string | null;
};

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, first_last_name, email")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: subjectsData } = await supabase
    .from("subjects")
    .select("name, slug, color")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  const subjects = (subjectsData ?? []) as Subject[];

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
            Panel de administración
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
            Bienvenido, {profile?.first_name ?? "administrador"}
          </h1>

          <p className="mt-3 max-w-3xl text-slate-600">
            Elige una materia para crear o alimentar temas olímpicos. Cada
            entrada que publiques podrá incluir video, lectura, cuestionario,
            ejemplos paso a paso y ejercicios propuestos.
          </p>
        </div>

        <section className="mt-6">
          <h2 className="mb-4 text-xl font-bold text-slate-950">
            Materias
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {subjects.map((subject) => (
              <Link
                key={subject.slug}
                href={`/admin/materias/${subject.slug}`}
                className="group rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1F2E67]/30"
              >
                <article>
                  <div
                    className="mb-4 h-2 w-20 rounded-full"
                    style={{ backgroundColor: subject.color ?? "#1F2E67" }}
                  />

                  <h3 className="text-lg font-bold text-slate-950 group-hover:text-[#1F2E67]">
                    {subject.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Crear temas y entradas para esta materia.
                  </p>

                  <p className="mt-4 text-sm font-semibold text-[#1F2E67]">
                    Entrar →
                  </p>
                </article>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold text-slate-950">
            Herramientas generales
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminToolCard
              href="/admin/alumnos"
              title="Alumnos"
              description="Consultar alumnos registrados y avance general."
            />

            <AdminToolCard
              href="/admin/avisos"
              title="Avisos"
              description="Publicar comunicados y recordatorios."
            />

           
          
          </div>
        </section>
      </section>
    </main>
  );
}

function AdminToolCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1F2E67]/30"
    >
      <article>
        <h3 className="font-bold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </article>
    </Link>
  );
}