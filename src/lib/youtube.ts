export function extractYouTubeVideoId(url: string) {
  try {
    const parsedUrl = new URL(url);

    const hostname = parsedUrl.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      const id = parsedUrl.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (parsedUrl.pathname === "/watch") {
        return parsedUrl.searchParams.get("v");
      }

      const parts = parsedUrl.pathname.split("/").filter(Boolean);

      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
        return parts[1] ?? null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function isValidYouTubeUrl(url: string) {
  return Boolean(extractYouTubeVideoId(url));
}

export function isValidYouTubeChannelUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, "");

    if (hostname !== "youtube.com") {
      return false;
    }

    const parts = parsedUrl.pathname.split("/").filter(Boolean);

    if (parts.length === 0) {
      return false;
    }

    const firstPart = parts[0];

    return (
      firstPart.startsWith("@") ||
      firstPart === "channel" ||
      firstPart === "c" ||
      firstPart === "user"
    );
  } catch {
    return false;
  }
}