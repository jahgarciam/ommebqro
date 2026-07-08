"use client";

import { useFormStatus } from "react-dom";

export function GoogleLoginButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#1F2E67] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Conectando...
        </>
      ) : (
        "Entrar con Google"
      )}
    </button>
  );
}