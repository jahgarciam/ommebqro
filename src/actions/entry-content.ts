"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addExampleSchema,
  addExerciseSchema,
  addReadingQuestionSchema,
} from "@/lib/validators/entry-content";

async function moveProgressBackAfterContentChange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entryId: string,
  step: "questions" | "examples" | "exercises"
) {
  const affectedSteps: Record<
    "questions" | "examples" | "exercises",
    ("questions" | "examples" | "exercises" | "completed")[]
  > = {
    questions: ["examples", "exercises", "completed"],
    examples: ["exercises", "completed"],
    exercises: ["completed"],
  };

  const { error } = await supabase
    .from("student_entry_progress")
    .update({
      current_step: step,
      completed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("entry_id", entryId)
    .in("current_step", affectedSteps[step]);

  if (error) {
    console.error("move-progress-back-error", error);
  }
}

async function requireAdmin() {
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

  return { supabase, user };
}

function entryUrl(subjectSlug: string, topicSlug: string, entrySlug: string) {
  return `/admin/materias/${subjectSlug}/temas/${topicSlug}/entradas/${entrySlug}`;
}

export async function addReadingQuestion(formData: FormData) {
  const parsed = addReadingQuestionSchema.safeParse({
    subjectSlug: formData.get("subjectSlug"),
    topicSlug: formData.get("topicSlug"),
    entryId: formData.get("entryId"),
    entrySlug: formData.get("entrySlug"),
    questionText: formData.get("questionText"),
    optionA: formData.get("optionA"),
    optionB: formData.get("optionB"),
    optionC: formData.get("optionC"),
    optionD: formData.get("optionD"),
    correctOption: formData.get("correctOption"),
    explanation: formData.get("explanation"),
  });

  const fallbackSubjectSlug = String(formData.get("subjectSlug") ?? "");
  const fallbackTopicSlug = String(formData.get("topicSlug") ?? "");
  const fallbackEntrySlug = String(formData.get("entrySlug") ?? "");

  if (!parsed.success) {
    redirect(
      `${entryUrl(
        fallbackSubjectSlug,
        fallbackTopicSlug,
        fallbackEntrySlug
      )}?error=invalid-question`
    );
  }

  const { supabase } = await requireAdmin();

  const { data: maxQuestion } = await supabase
    .from("quiz_questions")
    .select("order_index")
    .eq("entry_id", parsed.data.entryId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrderIndex = (maxQuestion?.order_index ?? 0) + 1;

  const { data: question, error: questionError } = await supabase
    .from("quiz_questions")
    .insert({
      entry_id: parsed.data.entryId,
      question_text: parsed.data.questionText,
      question_type: "single_choice",
      explanation: parsed.data.explanation || null,
      difficulty: null,
      is_active: true,
      order_index: nextOrderIndex,
    })
    .select("id")
    .single();

  if (questionError || !question) {
    redirect(
      `${entryUrl(
        parsed.data.subjectSlug,
        parsed.data.topicSlug,
        parsed.data.entrySlug
      )}?error=create-question`
    );
  }

  const options = [
    { letter: "A", optionText: parsed.data.optionA, orderIndex: 1 },
    { letter: "B", optionText: parsed.data.optionB, orderIndex: 2 },
    { letter: "C", optionText: parsed.data.optionC, orderIndex: 3 },
    { letter: "D", optionText: parsed.data.optionD, orderIndex: 4 },
  ];

  const { data: insertedOptions, error: optionsError } = await supabase
    .from("quiz_options")
    .insert(
      options.map((option) => ({
        question_id: question.id,
        option_text: option.optionText,
        order_index: option.orderIndex,
      }))
    )
    .select("id, order_index");

  if (optionsError || !insertedOptions) {
    redirect(
      `${entryUrl(
        parsed.data.subjectSlug,
        parsed.data.topicSlug,
        parsed.data.entrySlug
      )}?error=create-options`
    );
  }

  const correctOrderIndex =
    parsed.data.correctOption === "A"
      ? 1
      : parsed.data.correctOption === "B"
        ? 2
        : parsed.data.correctOption === "C"
          ? 3
          : 4;

  const correctOption = insertedOptions.find(
    (option) => option.order_index === correctOrderIndex
  );

  if (!correctOption) {
    redirect(
      `${entryUrl(
        parsed.data.subjectSlug,
        parsed.data.topicSlug,
        parsed.data.entrySlug
      )}?error=correct-option`
    );
  }

  const { error: correctError } = await supabase
    .from("quiz_correct_options")
    .insert({
      question_id: question.id,
      option_id: correctOption.id,
    });

  if (correctError) {
    redirect(
      `${entryUrl(
        parsed.data.subjectSlug,
        parsed.data.topicSlug,
        parsed.data.entrySlug
      )}?error=correct-save`
    );
  }

  await moveProgressBackAfterContentChange(
    supabase,
    parsed.data.entryId,
    "questions"
  );

  redirect(
    `${entryUrl(
      parsed.data.subjectSlug,
      parsed.data.topicSlug,
      parsed.data.entrySlug
    )}?success=question`
  );
}

export async function addExample(formData: FormData) {
  const parsed = addExampleSchema.safeParse({
    subjectSlug: formData.get("subjectSlug"),
    topicSlug: formData.get("topicSlug"),
    entryId: formData.get("entryId"),
    entrySlug: formData.get("entrySlug"),
    title: formData.get("title"),
    content: formData.get("content"),
    imageAlt: formData.get("imageAlt"),
  });

  const fallbackSubjectSlug = String(formData.get("subjectSlug") ?? "");
  const fallbackTopicSlug = String(formData.get("topicSlug") ?? "");
  const fallbackEntrySlug = String(formData.get("entrySlug") ?? "");

  if (!parsed.success) {
    redirect(
      `${entryUrl(
        fallbackSubjectSlug,
        fallbackTopicSlug,
        fallbackEntrySlug
      )}?error=invalid-example`
    );
  }

  const { supabase } = await requireAdmin();

  const imageFile = formData.get("imageFile");
  let imagePath: string | null = null;

  if (imageFile instanceof File && imageFile.size > 0) {
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(imageFile.type)) {
      redirect(
        `${entryUrl(
          parsed.data.subjectSlug,
          parsed.data.topicSlug,
          parsed.data.entrySlug
        )}?error=image-type`
      );
    }

    if (imageFile.size > maxSize) {
      redirect(
        `${entryUrl(
          parsed.data.subjectSlug,
          parsed.data.topicSlug,
          parsed.data.entrySlug
        )}?error=image-size`
      );
    }

    const extension =
      imageFile.type === "image/png"
        ? "png"
        : imageFile.type === "image/webp"
          ? "webp"
          : "jpg";

    imagePath = `examples/${parsed.data.entryId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("learning-assets")
      .upload(imagePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type,
      });

    if (uploadError) {
      redirect(
        `${entryUrl(
          parsed.data.subjectSlug,
          parsed.data.topicSlug,
          parsed.data.entrySlug
        )}?error=image-upload`
      );
    }
  }

  const { data: maxExample } = await supabase
    .from("examples")
    .select("order_index")
    .eq("entry_id", parsed.data.entryId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrderIndex = (maxExample?.order_index ?? 0) + 1;

  const { error } = await supabase.from("examples").insert({
    entry_id: parsed.data.entryId,
    title: parsed.data.title,
    content: parsed.data.content,
    image_path: imagePath,
    image_alt: parsed.data.imageAlt || null,
    order_index: nextOrderIndex,
  });

  if (error) {
    redirect(
      `${entryUrl(
        parsed.data.subjectSlug,
        parsed.data.topicSlug,
        parsed.data.entrySlug
      )}?error=create-example`
    );
  }

  await moveProgressBackAfterContentChange(
    supabase,
    parsed.data.entryId,
    "examples"
  );

  redirect(
    `${entryUrl(
      parsed.data.subjectSlug,
      parsed.data.topicSlug,
      parsed.data.entrySlug
    )}?success=example`
  );
}

export async function addExercise(formData: FormData) {
  const parsed = addExerciseSchema.safeParse({
    subjectSlug: formData.get("subjectSlug"),
    topicSlug: formData.get("topicSlug"),
    entryId: formData.get("entryId"),
    entrySlug: formData.get("entrySlug"),
    statement: formData.get("statement"),
    hint1: formData.get("hint1"),
    hint2: formData.get("hint2"),
    hint3: formData.get("hint3"),
    solutionContent: formData.get("solutionContent"),
  });

  const fallbackSubjectSlug = String(formData.get("subjectSlug") ?? "");
  const fallbackTopicSlug = String(formData.get("topicSlug") ?? "");
  const fallbackEntrySlug = String(formData.get("entrySlug") ?? "");

  if (!parsed.success) {
    redirect(
      `${entryUrl(
        fallbackSubjectSlug,
        fallbackTopicSlug,
        fallbackEntrySlug
      )}?error=invalid-exercise`
    );
  }

  const { supabase } = await requireAdmin();

  const { data: maxExercise } = await supabase
    .from("proposed_exercises")
    .select("order_index")
    .eq("entry_id", parsed.data.entryId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrderIndex = (maxExercise?.order_index ?? 0) + 1;

  const { error } = await supabase.from("proposed_exercises").insert({
    entry_id: parsed.data.entryId,
    statement: parsed.data.statement,
    hint_1: parsed.data.hint1 || null,
    hint_2: parsed.data.hint2 || null,
    hint_3: parsed.data.hint3 || null,
    solution_content: parsed.data.solutionContent || null,
    order_index: nextOrderIndex,
  });

  if (error) {
    redirect(
      `${entryUrl(
        parsed.data.subjectSlug,
        parsed.data.topicSlug,
        parsed.data.entrySlug
      )}?error=create-exercise`
    );
  }

  await moveProgressBackAfterContentChange(
    supabase,
    parsed.data.entryId,
    "exercises"
  );

  redirect(
    `${entryUrl(
      parsed.data.subjectSlug,
      parsed.data.topicSlug,
      parsed.data.entrySlug
    )}?success=exercise`
  );
}

export async function deleteReadingQuestion(formData: FormData) {
  const subjectSlug = String(formData.get("subjectSlug") ?? "");
  const topicSlug = String(formData.get("topicSlug") ?? "");
  const entrySlug = String(formData.get("entrySlug") ?? "");
  const questionId = String(formData.get("questionId") ?? "");

  const redirectUrl = `/admin/materias/${subjectSlug}/temas/${topicSlug}/entradas/${entrySlug}`;

  if (!subjectSlug || !topicSlug || !entrySlug || !questionId) {
    redirect(`${redirectUrl}?error=invalid-delete-question`);
  }

  const { supabase } = await requireAdmin();

  await supabase
    .from("quiz_correct_options")
    .delete()
    .eq("question_id", questionId);

  await supabase.from("quiz_options").delete().eq("question_id", questionId);

  const { error } = await supabase
    .from("quiz_questions")
    .delete()
    .eq("id", questionId);

  if (error) {
    redirect(`${redirectUrl}?error=delete-question`);
  }

  redirect(`${redirectUrl}?success=question-deleted`);
}

export async function deleteExample(formData: FormData) {
  const subjectSlug = String(formData.get("subjectSlug") ?? "");
  const topicSlug = String(formData.get("topicSlug") ?? "");
  const entrySlug = String(formData.get("entrySlug") ?? "");
  const exampleId = String(formData.get("exampleId") ?? "");

  const redirectUrl = `/admin/materias/${subjectSlug}/temas/${topicSlug}/entradas/${entrySlug}`;

  if (!subjectSlug || !topicSlug || !entrySlug || !exampleId) {
    redirect(`${redirectUrl}?error=invalid-delete-example`);
  }

  const { supabase } = await requireAdmin();

  const { data: example } = await supabase
    .from("examples")
    .select("image_path")
    .eq("id", exampleId)
    .single();

  if (example?.image_path) {
    await supabase.storage.from("learning-assets").remove([example.image_path]);
  }

  const { error } = await supabase.from("examples").delete().eq("id", exampleId);

  if (error) {
    redirect(`${redirectUrl}?error=delete-example`);
  }

  redirect(`${redirectUrl}?success=example-deleted`);
}

export async function deleteExercise(formData: FormData) {
  const subjectSlug = String(formData.get("subjectSlug") ?? "");
  const topicSlug = String(formData.get("topicSlug") ?? "");
  const entrySlug = String(formData.get("entrySlug") ?? "");
  const exerciseId = String(formData.get("exerciseId") ?? "");

  const redirectUrl = `/admin/materias/${subjectSlug}/temas/${topicSlug}/entradas/${entrySlug}`;

  if (!subjectSlug || !topicSlug || !entrySlug || !exerciseId) {
    redirect(`${redirectUrl}?error=invalid-delete-exercise`);
  }

  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("proposed_exercises")
    .delete()
    .eq("id", exerciseId);

  if (error) {
    redirect(`${redirectUrl}?error=delete-exercise`);
  }

  redirect(`${redirectUrl}?success=exercise-deleted`);
}
export async function updateReadingQuestion(formData: FormData) {
  const subjectSlug = String(formData.get("subjectSlug") ?? "").trim();
  const topicSlug = String(formData.get("topicSlug") ?? "").trim();
  const entrySlug = String(formData.get("entrySlug") ?? "").trim();
  const entryId = String(formData.get("entryId") ?? "").trim();
  const questionId = String(formData.get("questionId") ?? "").trim();

  const questionText = String(formData.get("questionText") ?? "").trim();
  const optionAId = String(formData.get("optionAId") ?? "").trim();
  const optionBId = String(formData.get("optionBId") ?? "").trim();
  const optionCId = String(formData.get("optionCId") ?? "").trim();
  const optionDId = String(formData.get("optionDId") ?? "").trim();

  const optionA = String(formData.get("optionA") ?? "").trim();
  const optionB = String(formData.get("optionB") ?? "").trim();
  const optionC = String(formData.get("optionC") ?? "").trim();
  const optionD = String(formData.get("optionD") ?? "").trim();

  const correctOption = String(formData.get("correctOption") ?? "").trim();
  const explanation = String(formData.get("explanation") ?? "").trim();

  const redirectUrl = `/admin/materias/${subjectSlug}/temas/${topicSlug}/entradas/${entrySlug}`;
  const editUrl = `${redirectUrl}/preguntas/${questionId}/editar`;

  if (!subjectSlug || !topicSlug || !entrySlug || !entryId || !questionId) {
    redirect(`${redirectUrl}?error=invalid-question-edit`);
  }

  if (questionText.length < 5 || questionText.length > 1000) {
    redirect(`${editUrl}?error=invalid-question-text`);
  }

  if (
    optionA.length < 1 ||
    optionB.length < 1 ||
    optionC.length < 1 ||
    optionD.length < 1
  ) {
    redirect(`${editUrl}?error=invalid-options`);
  }

  if (!["A", "B", "C", "D"].includes(correctOption)) {
    redirect(`${editUrl}?error=invalid-correct-option`);
  }

  if (explanation.length > 1500) {
    redirect(`${editUrl}?error=explanation-too-long`);
  }

  const forbiddenHtmlPattern =
    /<\s*(script|iframe|object|embed|form|input|button|style|link|meta)[\s>]/i;

  if (
    forbiddenHtmlPattern.test(questionText) ||
    forbiddenHtmlPattern.test(optionA) ||
    forbiddenHtmlPattern.test(optionB) ||
    forbiddenHtmlPattern.test(optionC) ||
    forbiddenHtmlPattern.test(optionD) ||
    forbiddenHtmlPattern.test(explanation)
  ) {
    redirect(`${editUrl}?error=unsafe-content`);
  }

  const { supabase } = await requireAdmin();

  const { error: questionError } = await supabase
    .from("quiz_questions")
    .update({
      question_text: questionText,
      explanation: explanation || null,
    })
    .eq("id", questionId)
    .eq("entry_id", entryId);

  if (questionError) {
    console.error("update-question-error", questionError);
    redirect(`${editUrl}?error=update-question`);
  }

  const optionUpdates = [
    { id: optionAId, text: optionA },
    { id: optionBId, text: optionB },
    { id: optionCId, text: optionC },
    { id: optionDId, text: optionD },
  ];

  for (const option of optionUpdates) {
    if (!option.id) {
      redirect(`${editUrl}?error=missing-option-id`);
    }

    const { error: optionError } = await supabase
      .from("quiz_options")
      .update({
        option_text: option.text,
      })
      .eq("id", option.id)
      .eq("question_id", questionId);

    if (optionError) {
      console.error("update-option-error", optionError);
      redirect(`${editUrl}?error=update-option`);
    }
  }

  const correctOptionId =
    correctOption === "A"
      ? optionAId
      : correctOption === "B"
        ? optionBId
        : correctOption === "C"
          ? optionCId
          : optionDId;

  await supabase
    .from("quiz_correct_options")
    .delete()
    .eq("question_id", questionId);

  const { error: correctError } = await supabase
    .from("quiz_correct_options")
    .insert({
      question_id: questionId,
      option_id: correctOptionId,
    });

  if (correctError) {
    console.error("update-correct-option-error", correctError);
    redirect(`${editUrl}?error=update-correct-option`);
  }

  await moveProgressBackAfterContentChange(supabase, entryId, "questions");

  redirect(`${redirectUrl}?success=question-updated`);
}
export async function updateExample(formData: FormData) {
  const subjectSlug = String(formData.get("subjectSlug") ?? "").trim();
  const topicSlug = String(formData.get("topicSlug") ?? "").trim();
  const entrySlug = String(formData.get("entrySlug") ?? "").trim();
  const entryId = String(formData.get("entryId") ?? "").trim();
  const exampleId = String(formData.get("exampleId") ?? "").trim();

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const imageAlt = String(formData.get("imageAlt") ?? "").trim();
  const removeImage = String(formData.get("removeImage") ?? "") === "true";
  const imageFile = formData.get("imageFile");

  const redirectUrl = `/admin/materias/${subjectSlug}/temas/${topicSlug}/entradas/${entrySlug}`;
  const editUrl = `${redirectUrl}/ejemplos/${exampleId}/editar`;

  if (!subjectSlug || !topicSlug || !entrySlug || !entryId || !exampleId) {
    redirect(`${redirectUrl}?error=invalid-example-edit`);
  }

  if (title.length < 3 || title.length > 120) {
    redirect(`${editUrl}?error=invalid-title`);
  }

  if (content.length < 3 || content.length > 20000) {
    redirect(`${editUrl}?error=invalid-content`);
  }

  if (imageAlt.length > 200) {
    redirect(`${editUrl}?error=image-alt-too-long`);
  }

  const forbiddenHtmlPattern =
    /<\s*(script|iframe|object|embed|form|input|button|style|link|meta)[\s>]/i;

  if (
    forbiddenHtmlPattern.test(title) ||
    forbiddenHtmlPattern.test(content) ||
    forbiddenHtmlPattern.test(imageAlt)
  ) {
    redirect(`${editUrl}?error=unsafe-content`);
  }

  const { supabase } = await requireAdmin();

  const { data: currentExample, error: currentExampleError } = await supabase
    .from("examples")
    .select("id, entry_id, image_path")
    .eq("id", exampleId)
    .eq("entry_id", entryId)
    .single();

  if (currentExampleError || !currentExample) {
    redirect(`${redirectUrl}?error=example-not-found`);
  }

  let newImagePath: string | null = currentExample.image_path ?? null;

  if (imageFile instanceof File && imageFile.size > 0) {
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(imageFile.type)) {
      redirect(`${editUrl}?error=image-type`);
    }

    if (imageFile.size > maxSize) {
      redirect(`${editUrl}?error=image-size`);
    }

    const extension =
      imageFile.type === "image/png"
        ? "png"
        : imageFile.type === "image/webp"
          ? "webp"
          : "jpg";

    newImagePath = `examples/${entryId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("learning-assets")
      .upload(newImagePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type,
      });

    if (uploadError) {
      console.error("update-example-image-upload-error", uploadError);
      redirect(`${editUrl}?error=image-upload`);
    }

    if (currentExample.image_path) {
      await supabase.storage
        .from("learning-assets")
        .remove([currentExample.image_path]);
    }
  } else if (removeImage && currentExample.image_path) {
    await supabase.storage
      .from("learning-assets")
      .remove([currentExample.image_path]);

    newImagePath = null;
  }

  const { error } = await supabase
    .from("examples")
    .update({
      title,
      content,
      image_path: newImagePath,
      image_alt: imageAlt || null,
    })
    .eq("id", exampleId)
    .eq("entry_id", entryId);

  if (error) {
    console.error("update-example-error", error);
    redirect(`${editUrl}?error=update-example`);
  }

  await moveProgressBackAfterContentChange(supabase, entryId, "examples");

  redirect(`${redirectUrl}?success=example-updated`);
}
export async function updateExercise(formData: FormData) {
  const subjectSlug = String(formData.get("subjectSlug") ?? "").trim();
  const topicSlug = String(formData.get("topicSlug") ?? "").trim();
  const entrySlug = String(formData.get("entrySlug") ?? "").trim();
  const entryId = String(formData.get("entryId") ?? "").trim();
  const exerciseId = String(formData.get("exerciseId") ?? "").trim();

  const statement = String(formData.get("statement") ?? "").trim();
  const hint1 = String(formData.get("hint1") ?? "").trim();
  const hint2 = String(formData.get("hint2") ?? "").trim();
  const hint3 = String(formData.get("hint3") ?? "").trim();
  const solutionContent = String(formData.get("solutionContent") ?? "").trim();

  const redirectUrl = `/admin/materias/${subjectSlug}/temas/${topicSlug}/entradas/${entrySlug}`;
  const editUrl = `${redirectUrl}/ejercicios/${exerciseId}/editar`;

  if (!subjectSlug || !topicSlug || !entrySlug || !entryId || !exerciseId) {
    redirect(`${redirectUrl}?error=invalid-exercise-edit`);
  }

  if (statement.length < 3 || statement.length > 20000) {
    redirect(`${editUrl}?error=invalid-statement`);
  }

  if (hint1.length > 1000 || hint2.length > 1000 || hint3.length > 1000) {
    redirect(`${editUrl}?error=hint-too-long`);
  }

  if (solutionContent.length > 5000) {
    redirect(`${editUrl}?error=solution-too-long`);
  }

  const forbiddenHtmlPattern =
    /<\s*(script|iframe|object|embed|form|input|button|style|link|meta)[\s>]/i;

  if (
    forbiddenHtmlPattern.test(statement) ||
    forbiddenHtmlPattern.test(hint1) ||
    forbiddenHtmlPattern.test(hint2) ||
    forbiddenHtmlPattern.test(hint3) ||
    forbiddenHtmlPattern.test(solutionContent)
  ) {
    redirect(`${editUrl}?error=unsafe-content`);
  }

  const { supabase } = await requireAdmin();

  const { data: currentExercise, error: currentExerciseError } = await supabase
    .from("proposed_exercises")
    .select("id, entry_id")
    .eq("id", exerciseId)
    .eq("entry_id", entryId)
    .single();

  if (currentExerciseError || !currentExercise) {
    redirect(`${redirectUrl}?error=exercise-not-found`);
  }

  const { error } = await supabase
    .from("proposed_exercises")
    .update({
      statement,
      hint_1: hint1 || null,
      hint_2: hint2 || null,
      hint_3: hint3 || null,
      solution_content: solutionContent || null,
    })
    .eq("id", exerciseId)
    .eq("entry_id", entryId);

  if (error) {
    console.error("update-exercise-error", error);
    redirect(`${editUrl}?error=update-exercise`);
  }

  await moveProgressBackAfterContentChange(supabase, entryId, "exercises");

  redirect(`${redirectUrl}?success=exercise-updated`);
}