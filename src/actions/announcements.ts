"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const allowedMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
];

const maxFileSize = 10 * 1024 * 1024;

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("announcement-profile-error", error);
    redirect("/admin/avisos?error=profile-error");
  }

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return { supabase, user };
}

function safeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export async function createAnnouncement(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const file = formData.get("file");

  if (title.length < 3 || title.length > 120) {
    redirect("/admin/avisos?error=invalid-title");
  }

  if (body.length > 800) {
    redirect("/admin/avisos?error=body-too-long");
  }

  const { supabase, user } = await requireAdmin();

  let filePath: string | null = null;
  let fileMimeType: string | null = null;
  let fileOriginalName: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (!allowedMimeTypes.includes(file.type)) {
      redirect("/admin/avisos?error=invalid-file-type");
    }

    if (file.size > maxFileSize) {
      redirect("/admin/avisos?error=file-too-large");
    }

    const sanitizedName = safeFileName(file.name || "archivo");
    const storagePath = `announcements/${crypto.randomUUID()}-${sanitizedName}`;

    const { error: uploadError } = await supabase.storage
      .from("public-assets")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("announcement-upload-error", uploadError);
      redirect("/admin/avisos?error=upload-failed");
    }

    filePath = storagePath;
    fileMimeType = file.type;
    fileOriginalName = file.name;
  }

  const { error } = await supabase.from("announcements").insert({
    title,
    body: body || null,
    file_path: filePath,
    file_mime_type: fileMimeType,
    file_original_name: fileOriginalName,
    status: "published",
    created_by: user.id,
  });

  if (error) {
    console.error("announcement-create-error", error);
    redirect("/admin/avisos?error=create-failed");
  }

  revalidatePath("/admin/avisos");
  revalidatePath("/dashboard");

  redirect("/admin/avisos?success=created");
}

export async function deleteAnnouncement(formData: FormData) {
  const announcementId = String(formData.get("announcementId") ?? "");

  if (!announcementId) {
    redirect("/admin/avisos?error=invalid-delete");
  }

  const { supabase } = await requireAdmin();

  const { data: announcement } = await supabase
    .from("announcements")
    .select("file_path")
    .eq("id", announcementId)
    .single();

  if (announcement?.file_path) {
    await supabase.storage.from("public-assets").remove([announcement.file_path]);
  }

  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", announcementId);

  if (error) {
    console.error("announcement-delete-error", error);
    redirect("/admin/avisos?error=delete-failed");
  }

  revalidatePath("/admin/avisos");
  revalidatePath("/dashboard");

  redirect("/admin/avisos?success=deleted");
}