export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F5F5] px-6">
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#1F2E67]" />

        <p className="mt-4 font-semibold text-slate-950">Cargando...</p>

        <p className="mt-2 text-sm text-slate-600">
          Estamos preparando la página.
        </p>
      </div>
    </main>
  );
}