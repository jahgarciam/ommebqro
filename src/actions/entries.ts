"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
import { createEntrySchema } from "@/lib/validators/entry";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { revalidatePath } from "next/cache";

export async function createEntry(formData: FormData) {
  const parsed = createEntrySchema.safeParse({
    subjectSlug: formData.get("subjectSlug"),
    topicId: formData.get("topicId"),
    topicSlug: formData.get("topicSlug"),
    levelId: formData.get("levelId"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    youtubeUrl: formData.get("youtubeUrl"),
    trainerName: formData.get("trainerName"),
    channelName: formData.get("channelName"),
    channelUrl: formData.get("channelUrl"),
    readingContent: formData.get("readingContent"),
    estimatedMinutes: formData.get("estimatedMinutes"),
    status: formData.get("status"),
  });

  const fallbackSubjectSlug = String(formData.get("subjectSlug") ?? "");
  const fallbackTopicSlug = String(formData.get("topicSlug") ?? "");

  if (!parsed.success) {
    redirect(
      `/admin/materias/${fallbackSubjectSlug}/temas/${fallbackTopicSlug}/crear-entrada?error=invalid`
    );
  }

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

  const title = parsed.data.title;
  const slug = slugify(title);
  const youtubeVideoId = extractYouTubeVideoId(parsed.data.youtubeUrl);

  if (!slug || !youtubeVideoId) {
    redirect(
      `/admin/materias/${parsed.data.subjectSlug}/temas/${parsed.data.topicSlug}/crear-entrada?error=invalid`
    );
  }

  const { data: existingEntry } = await supabase
    .from("entries")
    .select("id")
    .eq("topic_id", parsed.data.topicId)
    .eq("level_id", parsed.data.levelId)
    .eq("slug", slug)
    .maybeSingle();

  if (existingEntry) {
    redirect(
      `/admin/materias/${parsed.data.subjectSlug}/temas/${parsed.data.topicSlug}/crear-entrada?error=duplicate`
    );
  }

  const { data: maxOrderEntry } = await supabase
    .from("entries")
    .select("order_index")
    .eq("topic_id", parsed.data.topicId)
    .eq("level_id", parsed.data.levelId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrderIndex = (maxOrderEntry?.order_index ?? 0) + 1;

  const { data: trainerChannel, error: trainerError } = await supabase
    .from("trainer_channels")
    .insert({
      admin_user_id: user.id,
      trainer_name: parsed.data.trainerName,
      channel_name: parsed.data.channelName,
      youtube_channel_url: parsed.data.channelUrl,
      channel_handle: null,
      description: null,
      is_active: true,
    })
    .select("id")
    .single();

  if (trainerError || !trainerChannel) {
    redirect(
      `/admin/materias/${parsed.data.subjectSlug}/temas/${parsed.data.topicSlug}/crear-entrada?error=trainer`
    );
  }

  const { data: entry, error: entryError } = await supabase
    .from("entries")
    .insert({
      topic_id: parsed.data.topicId,
      level_id: parsed.data.levelId,
      trainer_channel_id: trainerChannel.id,
      title,
      slug,
      summary: parsed.data.summary || null,
      youtube_url_original: parsed.data.youtubeUrl,
      youtube_video_id: youtubeVideoId,
      reading_content: parsed.data.readingContent,
      estimated_minutes: parsed.data.estimatedMinutes,
      order_index: nextOrderIndex,
      status: "draft",
      created_by: user.id,
      published_at: null,
    })
    .select("slug")
    .single();

  if (entryError || !entry) {
    redirect(
      `/admin/materias/${parsed.data.subjectSlug}/temas/${parsed.data.topicSlug}/crear-entrada?error=create`
    );
  }

  redirect(
    `/admin/materias/${parsed.data.subjectSlug}/temas/${parsed.data.topicSlug}/entradas/${entry.slug}`
  );
}

export async function updateEntryStatus(formData: FormData) {
  const subjectSlug = String(formData.get("subjectSlug") ?? "");
  const topicSlug = String(formData.get("topicSlug") ?? "");
  const entrySlug = String(formData.get("entrySlug") ?? "");
  const entryId = String(formData.get("entryId") ?? "");
  const targetStatus = String(formData.get("targetStatus") ?? "");

  const allowedStatuses = ["draft", "published", "hidden", "archived"];
  const redirectUrl = `/admin/materias/${subjectSlug}/temas/${topicSlug}/entradas/${entrySlug}`;

  if (
    !subjectSlug ||
    !topicSlug ||
    !entrySlug ||
    !entryId ||
    !allowedStatuses.includes(targetStatus)
  ) {
    redirect(`${redirectUrl}?error=invalid-status`);
  }

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

  const { data: entry } = await supabase
    .from("entries")
    .select("id, youtube_video_id, reading_content")
    .eq("id", entryId)
    .single();

  if (!entry) {
    redirect(`${redirectUrl}?error=entry-not-found`);
  }

  if (targetStatus === "published") {
    const hasVideo = Boolean(entry.youtube_video_id);
    const hasReading = Boolean(
      entry.reading_content && entry.reading_content.trim().length >= 20
    );

    const { count: questionCount } = await supabase
      .from("quiz_questions")
      .select("id", { count: "exact", head: true })
      .eq("entry_id", entryId)
      .eq("is_active", true);

    const { count: exampleCount } = await supabase
      .from("examples")
      .select("id", { count: "exact", head: true })
      .eq("entry_id", entryId);

    const { count: exerciseCount } = await supabase
      .from("proposed_exercises")
      .select("id", { count: "exact", head: true })
      .eq("entry_id", entryId);

    if (
      !hasVideo ||
      !hasReading ||
      !questionCount ||
      !exampleCount ||
      !exerciseCount
    ) {
      redirect(`${redirectUrl}?error=publish-incomplete`);
    }
  }

  const { error } = await supabase
    .from("entries")
    .update({
      status: targetStatus,
      published_at:
        targetStatus === "published" ? new Date().toISOString() : null,
    })
    .eq("id", entryId);

  if (error) {
    redirect(`${redirectUrl}?error=status-update`);
  }

  redirect(`${redirectUrl}?success=status-updated`);
}
export async function removeEntryVideo(formData: FormData) {
  const subjectSlug = String(formData.get("subjectSlug") ?? "");
  const topicSlug = String(formData.get("topicSlug") ?? "");
  const entrySlug = String(formData.get("entrySlug") ?? "");
  const entryId = String(formData.get("entryId") ?? "");

  const redirectUrl = `/admin/materias/${subjectSlug}/temas/${topicSlug}/entradas/${entrySlug}`;

  if (!subjectSlug || !topicSlug || !entrySlug || !entryId) {
    redirect(`${redirectUrl}?error=invalid-remove-video`);
  }

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

  const { error } = await supabase
    .from("entries")
    .update({
      youtube_url_original: null,
      youtube_video_id: null,
      status: "draft",
      published_at: null,
    })
    .eq("id", entryId);

  if (error) {
    redirect(`${redirectUrl}?error=remove-video`);
  }

  redirect(`${redirectUrl}?success=video-removed`);
}

export async function deleteEntry(formData: FormData) {
  const subjectSlug = String(formData.get("subjectSlug") ?? "");
  const topicSlug = String(formData.get("topicSlug") ?? "");
  const entryId = String(formData.get("entryId") ?? "");

  const redirectUrl = `/admin/materias/${subjectSlug}/temas/${topicSlug}`;

  if (!subjectSlug || !topicSlug || !entryId) {
    redirect(`${redirectUrl}?error=invalid-delete-entry`);
  }

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

  const { data: examples } = await supabase
    .from("examples")
    .select("image_path")
    .eq("entry_id", entryId);

  const imagePaths =
    examples
      ?.map((example) => example.image_path)
      .filter((path): path is string => Boolean(path)) ?? [];

  if (imagePaths.length > 0) {
    await supabase.storage.from("learning-assets").remove(imagePaths);
  }

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id")
    .eq("entry_id", entryId);

  const questionIds = questions?.map((question) => question.id) ?? [];

  if (questionIds.length > 0) {
    await supabase
      .from("quiz_correct_options")
      .delete()
      .in("question_id", questionIds);

    await supabase
      .from("quiz_options")
      .delete()
      .in("question_id", questionIds);

    await supabase
      .from("quiz_questions")
      .delete()
      .in("id", questionIds);
  }

  await supabase.from("examples").delete().eq("entry_id", entryId);
  await supabase.from("proposed_exercises").delete().eq("entry_id", entryId);

  const { error } = await supabase
    .from("entries")
    .delete()
    .eq("id", entryId);

  if (error) {
    redirect(`${redirectUrl}?error=delete-entry`);
  }

  redirect(`${redirectUrl}?success=entry-deleted`);
}
export async function updateEntryBase(formData: FormData) {
  const subjectSlug = String(formData.get("subjectSlug") ?? "").trim();
  const topicSlug = String(formData.get("topicSlug") ?? "").trim();
  const entryId = String(formData.get("entryId") ?? "").trim();

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const youtubeUrl = String(formData.get("youtubeUrl") ?? "").trim();
  const trainerName = String(formData.get("trainerName") ?? "").trim();
  const channelName = String(formData.get("channelName") ?? "").trim();
  const channelUrl = String(formData.get("channelUrl") ?? "").trim();
  const readingContent = String(formData.get("readingContent") ?? "").trim();

  if (!subjectSlug || !topicSlug || !entryId) {
    redirect("/admin?error=invalid-entry-edit");
  }

  if (title.length < 3 || title.length > 140) {
    redirect(
      `/admin/materias/${subjectSlug}/temas/${topicSlug}?error=invalid-entry-title`
    );
  }

  if (summary.length > 500) {
    redirect(
      `/admin/materias/${subjectSlug}/temas/${topicSlug}?error=summary-too-long`
    );
  }

  if (readingContent.length < 3 || readingContent.length > 20000) {
    redirect(
      `/admin/materias/${subjectSlug}/temas/${topicSlug}?error=invalid-reading`
    );
  }

  const forbiddenHtmlPattern =
    /<\s*(script|iframe|object|embed|form|input|button|style|link|meta)[\s>]/i;

  if (
    forbiddenHtmlPattern.test(title) ||
    forbiddenHtmlPattern.test(summary) ||
    forbiddenHtmlPattern.test(readingContent)
  ) {
    redirect(
      `/admin/materias/${subjectSlug}/temas/${topicSlug}?error=unsafe-content`
    );
  }

  const videoId = extractYouTubeVideoIdFromUrl(youtubeUrl);

  if (!videoId) {
    redirect(
      `/admin/materias/${subjectSlug}/temas/${topicSlug}?error=invalid-youtube-url`
    );
  }

  if (trainerName.length < 2 || trainerName.length > 120) {
    redirect(
      `/admin/materias/${subjectSlug}/temas/${topicSlug}?error=invalid-trainer`
    );
  }

  if (channelName.length < 2 || channelName.length > 120) {
    redirect(
      `/admin/materias/${subjectSlug}/temas/${topicSlug}?error=invalid-channel`
    );
  }

  if (!isValidYouTubeChannelUrl(channelUrl)) {
    redirect(
      `/admin/materias/${subjectSlug}/temas/${topicSlug}?error=invalid-channel-url`
    );
  }

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

  const { data: currentEntry, error: currentEntryError } = await supabase
    .from("entries")
    .select("id, topic_id, slug")
    .eq("id", entryId)
    .single();

  if (currentEntryError || !currentEntry) {
    redirect(
      `/admin/materias/${subjectSlug}/temas/${topicSlug}?error=entry-not-found`
    );
  }

  const baseSlug = slugify(title);

  if (!baseSlug) {
    redirect(
      `/admin/materias/${subjectSlug}/temas/${topicSlug}?error=invalid-slug`
    );
  }

  let finalSlug = baseSlug;
  let counter = 2;

  while (true) {
    const { data: existingEntry } = await supabase
      .from("entries")
      .select("id")
      .eq("topic_id", currentEntry.topic_id)
      .eq("slug", finalSlug)
      .neq("id", entryId)
      .maybeSingle();

    if (!existingEntry) {
      break;
    }

    finalSlug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  const { data: existingTrainerChannel } = await supabase
    .from("trainer_channels")
    .select("id")
    .eq("youtube_channel_url", channelUrl)
    .maybeSingle();

  let trainerChannelId = existingTrainerChannel?.id ?? null;

  if (!trainerChannelId) {
    const { data: newTrainerChannel, error: trainerChannelError } =
      await supabase
        .from("trainer_channels")
        .insert({
          trainer_name: trainerName,
          channel_name: channelName,
          youtube_channel_url: channelUrl,
          created_by: user.id,
        })
        .select("id")
        .single();

    if (trainerChannelError || !newTrainerChannel) {
      redirect(
        `/admin/materias/${subjectSlug}/temas/${topicSlug}/entradas/${currentEntry.slug}/editar?error=trainer-channel`
      );
    }

    trainerChannelId = newTrainerChannel.id;
  } else {
    await supabase
      .from("trainer_channels")
      .update({
        trainer_name: trainerName,
        channel_name: channelName,
        youtube_channel_url: channelUrl,
      })
      .eq("id", trainerChannelId);
  }

  const { error } = await supabase
    .from("entries")
    .update({
      title,
      slug: finalSlug,
      summary: summary || null,
      youtube_url: youtubeUrl,
      youtube_video_id: videoId,
      reading_content: readingContent,
      trainer_channel_id: trainerChannelId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", entryId);

  if (error) {
    console.error("update-entry-base-error", error);

    redirect(
      `/admin/materias/${subjectSlug}/temas/${topicSlug}/entradas/${currentEntry.slug}/editar?error=update-failed`
    );
  }

  revalidatePath(`/admin/materias/${subjectSlug}`);
  revalidatePath(`/admin/materias/${subjectSlug}/temas/${topicSlug}`);
  revalidatePath(
    `/admin/materias/${subjectSlug}/temas/${topicSlug}/entradas/${currentEntry.slug}`
  );
  revalidatePath(
    `/admin/materias/${subjectSlug}/temas/${topicSlug}/entradas/${finalSlug}`
  );
  revalidatePath(`/materias/${subjectSlug}/temas/${topicSlug}`);
  revalidatePath(
    `/materias/${subjectSlug}/temas/${topicSlug}/entradas/${currentEntry.slug}`
  );
  revalidatePath(
    `/materias/${subjectSlug}/temas/${topicSlug}/entradas/${finalSlug}`
  );

  redirect(
    `/admin/materias/${subjectSlug}/temas/${topicSlug}/entradas/${finalSlug}?success=entry-updated`
  );
}

function extractYouTubeVideoIdFromUrl(value: string) {
  try {
    const url = new URL(value);

    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "").trim() || null;
    }

    if (url.hostname.includes("youtube.com")) {
      const watchId = url.searchParams.get("v");

      if (watchId) {
        return watchId;
      }

      const pathParts = url.pathname.split("/").filter(Boolean);

      if (
        pathParts[0] === "embed" ||
        pathParts[0] === "shorts" ||
        pathParts[0] === "live"
      ) {
        return pathParts[1] ?? null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function isValidYouTubeChannelUrl(value: string) {
  try {
    const url = new URL(value);

    if (!url.hostname.includes("youtube.com")) {
      return false;
    }

    const path = url.pathname;

    return (
      path.startsWith("/@") ||
      path.startsWith("/channel/") ||
      path.startsWith("/c/") ||
      path.startsWith("/user/")
    );
  } catch {
    return false;
  }
}