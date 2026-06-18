import { redirect } from "next/navigation";
import { completeOnboarding } from "@/actions/onboarding";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
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

if (profile?.accepted_privacy_notice_at) {
  redirect("/dashboard");
}

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-10">
      <section className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#1F2E67]">
          Primer acceso
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          Completa tu registro
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Pedimos únicamente los datos mínimos necesarios para asignarte un
          nivel de estudio y guardar tu avance.
        </p>

        <form action={completeOnboarding} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="firstName"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Primer nombre
            </label>
            <input
              id="firstName"
              name="firstName"
              required
              maxLength={40}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"            />
          </div>

          <div>
            <label
              htmlFor="firstLastName"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Primer apellido
            </label>
            <input
              id="firstLastName"
              name="firstLastName"
              required
              maxLength={40}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"            />
          </div>

          <div>
            <label
              htmlFor="grade"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Grado escolar
            </label>
            <select
              id="grade"
              name="grade"
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-[#1F2E67] focus:ring-2 focus:ring-[#1F2E67]/20"            >
              <option value="">Selecciona una opción</option>
              <option value="primaria_5_o_menor">
                5.º de primaria o menor
              </option>
              <option value="primaria_6">6.º de primaria</option>
              <option value="secundaria_1">1.º de secundaria</option>
              <option value="secundaria_2">2.º de secundaria</option>
            </select>
          </div>

          <label className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <input
              name="acceptedPrivacyNotice"
              type="checkbox"
              required
              className="mt-1"
            />
            <span>
              Confirmo que he leído y acepto el aviso de privacidad. Entiendo
              que la plataforma guardará mi primer nombre, primer apellido,
              correo y avance académico.
            </span>
          </label>

          <button
            type="submit"
            className="w-full rounded-2xl bg-[#1F2E67] px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Continuar
          </button>
        </form>
      </section>
    </main>
  );
}