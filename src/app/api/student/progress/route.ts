import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const progressSchema = z.object({
  entryId: z.string().uuid(),
  step: z.enum(["video", "reading", "examples", "exercises", "completed"]),
});

type ProgressPatch = {
  current_step: "reading" | "questions" | "exercises" | "completed";
  video_completed_at?: string;
  reading_completed_at?: string;
  examples_completed_at?: string;
  exercises_completed_at?: string;
  completed_at?: string;
  last_seen_at: string;
  updated_at: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = progressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid-payload",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "not-authenticated" },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("profile-error", profileError);

      return NextResponse.json(
        {
          ok: false,
          error: "profile-error",
          details: profileError.message,
          code: profileError.code,
        },
        { status: 500 }
      );
    }

    if (profile?.role !== "student") {
      return NextResponse.json(
        {
          ok: false,
          error: "not-student",
          role: profile?.role ?? null,
        },
        { status: 403 }
      );
    }

    const { data: entry, error: entryError } = await supabase
      .from("entries")
      .select("id, status")
      .eq("id", parsed.data.entryId)
      .single();

    if (entryError) {
      console.error("entry-error", entryError);

      return NextResponse.json(
        {
          ok: false,
          error: "entry-error",
          details: entryError.message,
          code: entryError.code,
        },
        { status: 500 }
      );
    }

    if (!entry || entry.status !== "published") {
      return NextResponse.json(
        {
          ok: false,
          error: "entry-not-published",
          status: entry?.status ?? null,
        },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    const patch: ProgressPatch = {
      current_step: "reading",
      last_seen_at: now,
      updated_at: now,
    };

    if (parsed.data.step === "video") {
      patch.current_step = "reading";
      patch.video_completed_at = now;
    }

    if (parsed.data.step === "reading") {
      patch.current_step = "questions";
      patch.reading_completed_at = now;
    }

    if (parsed.data.step === "examples") {
      patch.current_step = "exercises";
      patch.examples_completed_at = now;
    }

    if (parsed.data.step === "exercises" || parsed.data.step === "completed") {
      patch.current_step = "completed";
      patch.exercises_completed_at = now;
      patch.completed_at = now;
    }

    const { data: existingProgress, error: existingProgressError } =
      await supabase
        .from("student_entry_progress")
        .select("id")
        .eq("student_id", user.id)
        .eq("entry_id", parsed.data.entryId)
        .maybeSingle();

    if (existingProgressError) {
      console.error("existing-progress-error", existingProgressError);

      return NextResponse.json(
        {
          ok: false,
          error: "existing-progress-error",
          details: existingProgressError.message,
          code: existingProgressError.code,
        },
        { status: 500 }
      );
    }

    if (existingProgress?.id) {
      const { error: updateError } = await supabase
        .from("student_entry_progress")
        .update(patch)
        .eq("id", existingProgress.id)
        .eq("student_id", user.id);

      if (updateError) {
        console.error("update-progress-error", updateError);

        return NextResponse.json(
          {
            ok: false,
            error: "update-progress-error",
            details: updateError.message,
            code: updateError.code,
          },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabase
        .from("student_entry_progress")
        .insert({
          student_id: user.id,
          entry_id: parsed.data.entryId,
          ...patch,
        });

      if (insertError) {
        console.error("insert-progress-error", insertError);

        return NextResponse.json(
          {
            ok: false,
            error: "insert-progress-error",
            details: insertError.message,
            code: insertError.code,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      currentStep: patch.current_step,
    });
  } catch (error) {
    console.error("unexpected-progress-error", error);

    return NextResponse.json(
      {
        ok: false,
        error: "unexpected-progress-error",
      },
      { status: 500 }
    );
  }
}