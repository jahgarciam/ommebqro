"use client";

import { useEffect, useMemo, useRef } from "react";

type AdPlacement =
  | "landing-bottom"
  | "dashboard-bottom"
  | "announcements-bottom"
  | "calendar-bottom"
  | "lesson-completed-bottom";

type AdSlotProps = {
  placement: AdPlacement;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const slotByPlacement: Record<AdPlacement, string | undefined> = {
  "landing-bottom": process.env.NEXT_PUBLIC_ADSENSE_SLOT_LANDING_BOTTOM,
  "dashboard-bottom": process.env.NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD_BOTTOM,
  "announcements-bottom":
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_ANNOUNCEMENTS_BOTTOM,
  "calendar-bottom": process.env.NEXT_PUBLIC_ADSENSE_SLOT_CALENDAR_BOTTOM,
  "lesson-completed-bottom":
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_LESSON_COMPLETED_BOTTOM,
};

export function AdSlot({ placement }: AdSlotProps) {
  const pushedRef = useRef(false);

  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;
  const adSlot = slotByPlacement[placement];

  const adId = useMemo(() => `ad-${placement}`, [placement]);

  useEffect(() => {
    if (!adsEnabled || !clientId || !adSlot || pushedRef.current) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      pushedRef.current = true;
    } catch (error) {
      console.error("adsense-push-error", error);
    }
  }, [adsEnabled, clientId, adSlot]);

  if (!adsEnabled) {
    return null;
  }

  if (!clientId || !adSlot) {
    if (process.env.NODE_ENV === "production") {
      return null;
    }

    return (
      <aside
        className="my-6 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-center shadow-sm"
        data-ad-placement={placement}
      >
        <p className="text-xs font-semibold text-amber-800">
          Publicidad no configurada
        </p>
        <p className="mt-1 text-xs text-amber-700">
          Falta clientId o slot para: {placement}
        </p>
      </aside>
    );
  }

  return (
    <aside
      className="my-6 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm"
      data-ad-placement={placement}
    >
      <p className="mb-2 text-xs text-slate-500">Publicidad</p>

      <ins
        id={adId}
        className="adsbygoogle block min-h-24"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}