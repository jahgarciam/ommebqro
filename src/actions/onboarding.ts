"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecommendedLevelSlug } from "@/lib/grade";
import { onboardingSchema } from "@/lib/validators/onboarding";

export async function completeOnboarding(formData: FormData) {
  const parsed = onboardingSchema.safeParse({
    firstName: formData.get("firstName"),
    firstLastName: formData.get("firstLastName"),
    grade: formData.get("grade"),
    acceptedPrivacyNotice: formData.get("acceptedPrivacyNotice"),
  });

  if (!parsed.success) {
    redirect("/onboarding?error=invalid");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const recommendedLevelSlug = getRecommendedLevelSlug(parsed.data.grade);

  const { data: level, error: levelError } = await supabase
    .from("levels")
    .select("id")
    .eq("slug", recommendedLevelSlug)
    .single();

  if (levelError || !level) {
    redirect("/onboarding?error=level");
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      first_last_name: parsed.data.firstLastName,
      grade: parsed.data.grade,
      recommended_level_id: level.id,
      accepted_privacy_notice_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    redirect("/onboarding?error=save");
  }

  redirect("/dashboard");
}