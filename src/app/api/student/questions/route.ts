import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const answerSchema = z.object({
  entryId: z.string().uuid(),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        optionId: z.string().uuid(),
      })
    )
    .min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = answerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid-payload" },
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "student") {
    return NextResponse.json(
      { ok: false, error: "not-student" },
      { status: 403 }
    );
  }

  const { data, error } = await supabase.rpc("submit_entry_answers", {
    p_entry_id: parsed.data.entryId,
    p_answers: parsed.data.answers,
  });

  if (error) {
    console.error("submit-answers-failed", error);

    return NextResponse.json(
      {
        ok: false,
        error: "submit-answers-failed",
        details: error.message,
      },
      { status: 500 }
    );
  }

  const { data: feedbackData, error: feedbackError } = await supabase.rpc(
    "get_entry_answer_feedback",
    {
      p_entry_id: parsed.data.entryId,
    }
  );

  if (feedbackError) {
    console.error("feedback-failed", feedbackError);

    return NextResponse.json(
      {
        ok: false,
        error: "feedback-failed",
        details: feedbackError.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    result: Array.isArray(data) ? data[0] : data,
    feedback: feedbackData ?? [],
  });
}