"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
import { createTopicSchema } from "@/lib/validators/topic";

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

function hasUnsafeHtml(value: string) {
  const forbiddenHtmlPattern =
    /<\s*(script|iframe|object|embed|form|input|button|style|link|meta)[\s>]/i;

  return forbiddenHtmlPattern.test(value);
}

export async function createTopic(formData: FormData) {
  const parsed = createTopicSchema.safeParse({
    subjectId: formData.get("subjectId"),
    subjectSlug: formData.get("subjectSlug"),
    title: formData.get("title"),
    description: formData.get("description"),
    nivel1Difficulty: formData.get("nivel1Difficulty") ?? "",
    nivel2Difficulty: formData.get("nivel2Difficulty") ?? "",
    nivel3Difficulty: formData.get("nivel3Difficulty") ?? "",
  });

  if (!parsed.success) {
    redirect(`/admin/materias/${formData.get("subjectSlug")}?error=invalid`);
  }

  const { supabase, user } = await requireAdmin();

  const title = parsed.data.title;
  const slug = slugify(title);

  if (!slug) {
    redirect(`/admin/materias/${parsed.data.subjectSlug}?error=slug`);
  }

  const { data: existingTopic } = await supabase
    .from("topics")
    .select("id")
    .eq("subject_id", parsed.data.subjectId)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (existingTopic) {
    redirect(`/admin/materias/${parsed.data.subjectSlug}?error=duplicate`);
  }

  const { data: maxOrderTopic } = await supabase
    .from("topics")
    .select("order_index")
    .eq("subject_id", parsed.data.subjectId)
    .eq("is_active", true)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrderIndex = (maxOrderTopic?.order_index ?? 0) + 1;

  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .insert({
      subject_id: parsed.data.subjectId,
      title,
      slug,
      description: parsed.data.description || null,
      order_index: nextOrderIndex,
      is_seed_topic: false,
      is_active: true,
      student_visible: false,
      created_by: user.id,
    })
    .select("id, slug")
    .single();

  if (topicError || !topic) {
    redirect(`/admin/materias/${parsed.data.subjectSlug}?error=create`);
  }

  const { data: levels } = await supabase
    .from("levels")
    .select("id, slug")
    .in("slug", ["nivel-1", "nivel-2", "nivel-3"]);

  const levelMap = new Map((levels ?? []).map((level) => [level.slug, level.id]));

  const settingsToInsert = [
    {
      levelSlug: "nivel-1",
      difficulty: parsed.data.nivel1Difficulty,
    },
    {
      levelSlug: "nivel-2",
      difficulty: parsed.data.nivel2Difficulty,
    },
    {
      levelSlug: "nivel-3",
      difficulty: parsed.data.nivel3Difficulty,
    },
  ]
    .filter((item) => item.difficulty !== "")
    .map((item) => ({
      topic_id: topic.id,
      level_id: levelMap.get(item.levelSlug),
      difficulty: item.difficulty,
      is_visible: true,
      is_recommended: true,
      order_index: nextOrderIndex,
    }))
    .filter((item) => Boolean(item.level_id));

  if (settingsToInsert.length > 0) {
    const { error: settingsError } = await supabase
      .from("topic_level_settings")
      .insert(settingsToInsert);

    if (settingsError) {
      redirect(`/admin/materias/${parsed.data.subjectSlug}?error=settings`);
    }
  }

  revalidatePath(`/admin/materias/${parsed.data.subjectSlug}`);

  redirect(`/admin/materias/${parsed.data.subjectSlug}/temas/${topic.slug}`);
}

export async function toggleTopicStudentVisibility(formData: FormData) {
  const subjectSlug = String(formData.get("subjectSlug") ?? "").trim();
  const topicId = String(formData.get("topicId") ?? "").trim();
  const targetVisible = String(formData.get("targetVisible") ?? "") === "true";

  if (!subjectSlug || !topicId) {
    redirect("/admin?error=invalid-topic-visibility");
  }

  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("topics")
    .update({
      student_visible: targetVisible,
    })
    .eq("id", topicId)
    .eq("is_active", true);

  if (error) {
    redirect(`/admin/materias/${subjectSlug}?error=topic-visibility`);
  }

  revalidatePath(`/admin/materias/${subjectSlug}`);
  revalidatePath(`/materias/${subjectSlug}`);

  redirect(
    `/admin/materias/${subjectSlug}?success=${
      targetVisible ? "topic-visible" : "topic-hidden"
    }`
  );
}

export async function updateTopic(formData: FormData) {
  const topicId = String(formData.get("topicId") ?? "").trim();
  const currentSubjectSlug = String(
    formData.get("currentSubjectSlug") ?? ""
  ).trim();
  const currentTopicSlug = String(formData.get("currentTopicSlug") ?? "").trim();

  const targetSubjectId = String(formData.get("targetSubjectId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  const fallbackUrl = `/admin/materias/${currentSubjectSlug}/temas/${currentTopicSlug}/editar`;

  if (!topicId || !currentSubjectSlug || !currentTopicSlug || !targetSubjectId) {
    redirect(`/admin/materias/${currentSubjectSlug}?error=invalid-topic-update`);
  }

  if (title.length < 3 || title.length > 120) {
    redirect(`${fallbackUrl}?error=invalid-title`);
  }

  if (description.length > 500) {
    redirect(`${fallbackUrl}?error=invalid-description`);
  }

  if (hasUnsafeHtml(title) || hasUnsafeHtml(description)) {
    redirect(`${fallbackUrl}?error=unsafe-content`);
  }

  const newSlug = slugify(title);

  if (!newSlug) {
    redirect(`${fallbackUrl}?error=slug`);
  }

  const { supabase } = await requireAdmin();

  const { data: targetSubject, error: targetSubjectError } = await supabase
    .from("subjects")
    .select("id, slug")
    .eq("id", targetSubjectId)
    .eq("is_active", true)
    .single();

  if (targetSubjectError || !targetSubject) {
    redirect(`${fallbackUrl}?error=subject-not-found`);
  }

  const { data: currentTopic, error: currentTopicError } = await supabase
    .from("topics")
    .select("id, subject_id, order_index")
    .eq("id", topicId)
    .eq("is_active", true)
    .single();

  if (currentTopicError || !currentTopic) {
    redirect(`/admin/materias/${currentSubjectSlug}?error=topic-not-found`);
  }

  const { data: duplicateTopic } = await supabase
    .from("topics")
    .select("id")
    .eq("subject_id", targetSubject.id)
    .eq("slug", newSlug)
    .eq("is_active", true)
    .neq("id", topicId)
    .maybeSingle();

  if (duplicateTopic) {
    redirect(`${fallbackUrl}?error=duplicate`);
  }

  const topicMoved = currentTopic.subject_id !== targetSubject.id;

  let nextOrderIndex = currentTopic.order_index ?? 1;

  if (topicMoved) {
    const { data: maxOrderTopic } = await supabase
      .from("topics")
      .select("order_index")
      .eq("subject_id", targetSubject.id)
      .eq("is_active", true)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    nextOrderIndex = (maxOrderTopic?.order_index ?? 0) + 1;
  }

  const { error } = await supabase
    .from("topics")
    .update({
      subject_id: targetSubject.id,
      title,
      slug: newSlug,
      description: description || null,
      order_index: nextOrderIndex,
    })
    .eq("id", topicId);

  if (error) {
    console.error("update-topic-error", error);
    redirect(`${fallbackUrl}?error=update`);
  }

  revalidatePath(`/admin/materias/${currentSubjectSlug}`);
  revalidatePath(`/materias/${currentSubjectSlug}`);
  revalidatePath(`/admin/materias/${targetSubject.slug}`);
  revalidatePath(`/materias/${targetSubject.slug}`);

  redirect(
    `/admin/materias/${targetSubject.slug}/temas/${newSlug}?success=topic-updated`
  );
}

export async function deleteTopic(formData: FormData) {
  const topicId = String(formData.get("topicId") ?? "").trim();
  const subjectSlug = String(formData.get("subjectSlug") ?? "").trim();
  const topicTitle = String(formData.get("topicTitle") ?? "").trim();
  const topicSlug = String(formData.get("topicSlug") ?? "").trim();
  const confirmTitle = String(formData.get("confirmTitle") ?? "").trim();
  const confirmWord = String(formData.get("confirmWord") ?? "").trim();

  const editUrl = topicSlug
    ? `/admin/materias/${subjectSlug}/temas/${topicSlug}/editar`
    : `/admin/materias/${subjectSlug}`;

  if (!topicId || !subjectSlug || !topicTitle) {
    redirect(`/admin/materias/${subjectSlug}?error=invalid-topic-delete`);
  }

  if (confirmTitle !== topicTitle || confirmWord !== "ELIMINAR") {
    redirect(`${editUrl}?error=delete-confirmation`);
  }

  const { supabase } = await requireAdmin();

  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id, title")
    .eq("id", topicId)
    .eq("is_active", true)
    .single();

  if (topicError || !topic) {
    redirect(`/admin/materias/${subjectSlug}?error=topic-not-found`);
  }

  if (topic.title !== topicTitle) {
    redirect(`${editUrl}?error=delete-confirmation`);
  }

  const { error } = await supabase
    .from("topics")
    .update({
      is_active: false,
      student_visible: false,
    })
    .eq("id", topicId);

  if (error) {
    console.error("delete-topic-error", error);
    redirect(`${editUrl}?error=delete-topic`);
  }

  revalidatePath(`/admin/materias/${subjectSlug}`);
  revalidatePath(`/materias/${subjectSlug}`);

  redirect(`/admin/materias/${subjectSlug}?success=topic-deleted`);
}

export async function restoreTopic(formData: FormData) {
  const topicId = String(formData.get("topicId") ?? "").trim();
  const subjectSlug = String(formData.get("subjectSlug") ?? "").trim();

  if (!topicId || !subjectSlug) {
    redirect(`/admin/materias/${subjectSlug}?error=invalid-topic-restore`);
  }

  const { supabase } = await requireAdmin();

  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id, subject_id, slug")
    .eq("id", topicId)
    .eq("is_active", false)
    .single();

  if (topicError || !topic) {
    redirect(
      `/admin/materias/${subjectSlug}/temas-eliminados?error=topic-not-found`
    );
  }

  const { data: duplicateTopic } = await supabase
    .from("topics")
    .select("id")
    .eq("subject_id", topic.subject_id)
    .eq("slug", topic.slug)
    .eq("is_active", true)
    .neq("id", topic.id)
    .maybeSingle();

  if (duplicateTopic) {
    redirect(`/admin/materias/${subjectSlug}/temas-eliminados?error=duplicate`);
  }

  const { error } = await supabase
    .from("topics")
    .update({
      is_active: true,
      student_visible: false,
    })
    .eq("id", topicId);

  if (error) {
    console.error("restore-topic-error", error);
    redirect(`/admin/materias/${subjectSlug}/temas-eliminados?error=restore`);
  }

  revalidatePath(`/admin/materias/${subjectSlug}`);
  revalidatePath(`/admin/materias/${subjectSlug}/temas-eliminados`);
  revalidatePath(`/materias/${subjectSlug}`);

  redirect(
    `/admin/materias/${subjectSlug}/temas-eliminados?success=topic-restored`
  );
}