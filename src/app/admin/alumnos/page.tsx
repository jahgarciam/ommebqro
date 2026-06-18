import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gradeLabels, type Grade } from "@/lib/grade";

type StatusFilter = "todos" | "sin-iniciar" | "en-progreso" | "completado";

type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  first_last_name: string | null;
  grade: Grade | null;
  role: "student" | "admin";
  created_at: string;
};

type Entry = {
  id: string;
  title: string;
  slug: string;
  topic_id: string;
};

type Progress = {
  student_id: string;
  entry_id: string;
  current_step:
    | "video"
    | "reading"
    | "questions"
    | "examples"
    | "exercises"
    | "completed";
  completed_at: string | null;
  last_seen_at: string | null;
};

type StudentRow = {
  student: Profile;
  completedEntries: number;
  inProgressEntries: number;
  percent: number;
  status: "Sin entradas publicadas" | "Sin iniciar" | "En progreso" | "Completado";
  lastProgress?: Progress;
};

const stepLabels: Record<Progress["current_step"], string> = {
  video: "Video",
  reading: "Lectura",
  questions: "Preguntas",
  examples: "Ejemplos",
  exercises: "Ejercicios",
  completed: "Completada",
};

const gradeOptions: { value: Grade; label: string }[] = [
  { value: "primaria_5_o_menor", label: gradeLabels.primaria_5_o_menor },
  { value: "primaria_6", label: gradeLabels.primaria_6 },
  { value: "secundaria_1", label: gradeLabels.secundaria_1 },
  { value: "secundaria_2", label: gradeLabels.secundaria_2 },
];

function calculatePercent(completed: number, total: number) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

function formatDate(value: string | null) {
  if (!value) return "Sin actividad";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStudentName(student: Profile) {
  const firstName = student.first_name?.trim();
  const firstLastName = student.first_last_name?.trim();

  if (firstName || firstLastName) {
    return [firstName, firstLastName].filter(Boolean).join(" ");
  }

  return student.email ?? "Alumno sin nombre";
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getStatusForFilter(status: StudentRow["status"]): StatusFilter {
  if (status === "Completado") return "completado";
  if (status === "En progreso") return "en-progreso";
  if (status === "Sin iniciar") return "sin-iniciar";
  return "todos";
}

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    grade?: string;
    status?: string;
  }>;
}) {
  const filters = await searchParams;

  const q = filters.q?.trim() ?? "";
  const grade = filters.grade?.trim() ?? "todos";
  const status = (filters.status?.trim() ?? "todos") as StatusFilter;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: studentsData } = await supabase
    .from("profiles")
    .select("id, email, first_name, first_last_name, grade, role, created_at")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  const students = (studentsData ?? []) as Profile[];

  const { data: entriesData } = await supabase
    .from("entries")
    .select("id, title, slug, topic_id")
    .eq("status", "published");

  const entries = (entriesData ?? []) as Entry[];
  const entryIds = entries.map((entry) => entry.id);

  const { data: progressData } =
    entryIds.length > 0
      ? await supabase
          .from("student_entry_progress")
          .select(
            "student_id, entry_id, current_step, completed_at, last_seen_at"
          )
          .in("entry_id", entryIds)
      : { data: [] };

  const progressList = (progressData ?? []) as Progress[];
  const totalPublishedEntries = entries.length;

  const activeStudentIds = new Set(
    progressList
      .filter((progress) => progress.last_seen_at)
      .map((progress) => progress.student_id)
  );

  const completedProgress = progressList.filter(
    (progress) => progress.current_step === "completed"
  );

  const possibleCompletions = students.length * totalPublishedEntries;

  const globalProgressPercent =
    possibleCompletions === 0
      ? 0
      : Math.round((completedProgress.length / possibleCompletions) * 100);

  const progressByStudentId = new Map<string, Progress[]>();

  for (const progress of progressList) {
    const current = progressByStudentId.get(progress.student_id) ?? [];
    current.push(progress);
    progressByStudentId.set(progress.student_id, current);
  }

  const rows: StudentRow[] = students.map((student) => {
    const studentProgress = progressByStudentId.get(student.id) ?? [];

    const completedEntries = studentProgress.filter(
      (progress) => progress.current_step === "completed"
    ).length;

    const inProgressEntries = studentProgress.filter(
      (progress) => progress.current_step !== "completed"
    ).length;

    const percent = calculatePercent(completedEntries, totalPublishedEntries);

    const lastProgress = [...studentProgress]
      .filter((progress) => progress.last_seen_at)
      .sort((a, b) => {
        const dateA = new Date(a.last_seen_at ?? 0).getTime();
        const dateB = new Date(b.last_seen_at ?? 0).getTime();
        return dateB - dateA;
      })[0];

    const rowStatus =
      totalPublishedEntries === 0
        ? "Sin entradas publicadas"
        : completedEntries === totalPublishedEntries
          ? "Completado"
          : studentProgress.length > 0
            ? "En progreso"
            : "Sin iniciar";

    return {
      student,
      completedEntries,
      inProgressEntries,
      percent,
      status: rowStatus,
      lastProgress,
    };
  });

  const filteredRows = rows.filter((row) => {
    const student = row.student;
    const searchText = normalize(
      `${getStudentName(student)} ${student.email ?? ""}`
    );

    const matchesSearch = q ? searchText.includes(normalize(q)) : true;
    const matchesGrade = grade === "todos" ? true : student.grade === grade;
    const matchesStatus =
      status === "todos" ? true : getStatusForFilter(row.status) === status;

    return matchesSearch && matchesGrade && matchesStatus;
  });

  const exportParams = new URLSearchParams();

  if (q) exportParams.set("q", q);
  if (grade !== "todos") exportParams.set("grade", grade);
  if (status !== "todos") exportParams.set("status", status);

  const exportUrl = `/admin/alumnos/export${
    exportParams.toString() ? `?${exportParams.toString()}` : ""
  }`;

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <Link href="/admin" className="text-sm font-semibold text-[#1F2E67]">
            ← Volver al panel admin
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
            Seguimiento
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
            Alumnos
          </h1>

          <p className="mt-3 max-w-3xl text-slate-600">
            Revisa el avance general de los alumnos registrados en la
            plataforma.
          </p>
        </div>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <SummaryCard label="Alumnos registrados" value={students.length} />
          <SummaryCard
            label="Alumnos con actividad"
            value={activeStudentIds.size}
          />
          <SummaryCard
            label="Entradas publicadas"
            value={totalPublishedEntries}
          />
          <SummaryCard label="Avance global" value={`${globalProgressPercent}%`} />
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Lista de alumnos
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Mostrando {filteredRows.length} de {students.length} alumnos.
              </p>
            </div>

            <a
              href={exportUrl}
              className="inline-flex justify-center rounded-2xl bg-[#1F2E67] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Exportar CSV
            </a>
          </div>

          <form
            action="/admin/alumnos"
            method="get"
            className="mt-5 grid grid-cols-1 gap-3 rounded-3xl bg-slate-50 p-4 lg:grid-cols-[1.5fr_1fr_1fr_auto]"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Buscar
              </span>
              <input
                name="q"
                defaultValue={q}
                placeholder="Nombre o correo"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Grado
              </span>
              <select
                name="grade"
                defaultValue={grade}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
              >
                <option value="todos">Todos</option>
                {gradeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Estado
              </span>
              <select
                name="status"
                defaultValue={status}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"
              >
                <option value="todos">Todos</option>
                <option value="sin-iniciar">Sin iniciar</option>
                <option value="en-progreso">En progreso</option>
                <option value="completado">Completado</option>
              </select>
            </label>

            <div className="flex gap-2 lg:items-end">
              <button
                type="submit"
                className="w-full rounded-2xl bg-[#1F2E67] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Filtrar
              </button>

              <Link
                href="/admin/alumnos"
                className="inline-flex w-full justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Limpiar
              </Link>
            </div>
          </form>

          {filteredRows.length === 0 ? (
            <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              No hay alumnos que coincidan con los filtros seleccionados.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[900px] border-separate border-spacing-y-3 text-left">
                <thead>
                  <tr className="text-sm text-slate-500">
                    <th className="px-4 py-2">Alumno</th>
                    <th className="px-4 py-2">Correo</th>
                    <th className="px-4 py-2">Grado</th>
                    <th className="px-4 py-2">Avance</th>
                    <th className="px-4 py-2">Estado</th>
                    <th className="px-4 py-2">Última actividad</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row) => {
                    const student = row.student;

                    return (
                      <tr key={student.id}>
                        <td className="rounded-l-2xl bg-slate-50 px-4 py-4">
                          <Link
                            href={`/admin/alumnos/${student.id}`}
                            className="font-semibold text-[#1F2E67] hover:underline"
                          >
                            {getStudentName(student)}
                          </Link>
                        </td>

                        <td className="bg-slate-50 px-4 py-4 text-sm text-slate-600">
                          {student.email ?? "Sin correo"}
                        </td>

                        <td className="bg-slate-50 px-4 py-4 text-sm text-slate-600">
                          {student.grade ? gradeLabels[student.grade] : "Sin grado"}
                        </td>

                        <td className="bg-slate-50 px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-white">
                              <div
                                className={`h-full rounded-full ${
                                  row.percent >= 100
                                    ? "bg-green-600"
                                    : "bg-[#1F2E67]"
                                }`}
                                style={{ width: `${row.percent}%` }}
                              />
                            </div>

                            <span className="text-sm font-semibold text-slate-700">
                              {row.percent}%
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            {row.completedEntries} completas ·{" "}
                            {row.inProgressEntries} en progreso
                          </p>
                        </td>

                        <td className="bg-slate-50 px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              row.status === "Completado"
                                ? "bg-green-50 text-green-700"
                                : row.status === "En progreso"
                                  ? "bg-blue-50 text-[#1F2E67]"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {row.status}
                          </span>

                          {row.lastProgress ? (
                            <p className="mt-2 text-xs text-slate-500">
                              Último paso:{" "}
                              {stepLabels[row.lastProgress.current_step]}
                            </p>
                          ) : null}
                        </td>

                        <td className="rounded-r-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                          {formatDate(row.lastProgress?.last_seen_at ?? null)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-[#1F2E67]">{value}</p>
    </div>
  );
}