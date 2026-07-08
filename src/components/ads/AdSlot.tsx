"use client";

import { useEffect } from "react";

type AdPlacement =
  | "landing-bottom"
  | "dashboard-bottom"
  | "announcements-bottom"
  | "calendar-bottom"
  | "lesson-completed-bottom"
  | "resources-left"
  | "resources-right"
  | "resources-bottom";

type AdSlotProps = {
  placement: AdPlacement;
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

function getSlotId(placement: AdPlacement) {
  const slots: Record<AdPlacement, string | undefined> = {
    "landing-bottom": process.env.NEXT_PUBLIC_ADSENSE_SLOT_LANDING_BOTTOM,
    "dashboard-bottom": process.env.NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD_BOTTOM,
    "announcements-bottom":
      process.env.NEXT_PUBLIC_ADSENSE_SLOT_ANNOUNCEMENTS_BOTTOM,
    "calendar-bottom": process.env.NEXT_PUBLIC_ADSENSE_SLOT_CALENDAR_BOTTOM,
    "lesson-completed-bottom":
      process.env.NEXT_PUBLIC_ADSENSE_SLOT_LESSON_COMPLETED_BOTTOM,
    "resources-left": process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESOURCES_LEFT,
    "resources-right": process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESOURCES_RIGHT,
    "resources-bottom": process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESOURCES_BOTTOM,
  };

  return slots[placement];
}

export function AdSlot({ placement, className = "" }: AdSlotProps) {
  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;
  const slotId = getSlotId(placement);

  useEffect(() => {
    if (!adsEnabled || !clientId || !slotId) return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (error) {
      console.warn("AdSense no pudo cargar el anuncio.", error);
    }
  }, [adsEnabled, clientId, slotId]);

  if (!adsEnabled || !clientId || !slotId) {
    return null;
  }

  return (
    <ins
      className={`adsbygoogle block ${className}`}
      style={{ display: "block" }}
      data-ad-client={clientId}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}