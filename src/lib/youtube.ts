import { prisma } from "./prisma";

const YT_API = "https://www.googleapis.com/youtube/v3";

export type YtChannel = {
  id: string;
  title: string;
  description: string;
  customUrl?: string;
  thumbnailUrl?: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
};

export type YtVideo = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags: string[];
};

async function getGoogleAccessToken(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });
  if (!account?.access_token) return null;

  const expiresAt = account.expires_at ? account.expires_at * 1000 : 0;
  if (expiresAt && Date.now() < expiresAt - 60_000) {
    return account.access_token;
  }

  if (!account.refresh_token) return account.access_token;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return account.access_token;
  const data = await res.json();
  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    },
  });
  return data.access_token as string;
}

function apiKey() {
  return process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY || "";
}

async function ytFetch(path: string, params: Record<string, string>, accessToken?: string | null) {
  const url = new URL(`${YT_API}/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const headers: HeadersInit = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else {
    const key = apiKey();
    if (!key) throw new Error("YouTube API kaliti yoki Google OAuth token kerak");
    url.searchParams.set("key", key);
  }

  const res = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API xato: ${res.status} ${text}`);
  }
  return res.json();
}

function mapChannel(item: any): YtChannel {
  const sn = item.snippet || {};
  const st = item.statistics || {};
  return {
    id: item.id,
    title: sn.title || "Noma'lum kanal",
    description: sn.description || "",
    customUrl: sn.customUrl,
    thumbnailUrl: sn.thumbnails?.high?.url || sn.thumbnails?.default?.url,
    subscriberCount: Number(st.subscriberCount || 0),
    viewCount: Number(st.viewCount || 0),
    videoCount: Number(st.videoCount || 0),
  };
}

export async function fetchMyChannels(userId: string): Promise<YtChannel[]> {
  const token = await getGoogleAccessToken(userId);
  if (!token) throw new Error("Google hisob ulanmagan. Qayta kiring.");

  const data = await ytFetch(
    "channels",
    { part: "snippet,statistics,contentDetails", mine: "true" },
    token
  );
  return (data.items || []).map(mapChannel);
}

export async function fetchChannelById(channelId: string, userId?: string): Promise<YtChannel | null> {
  const token = userId ? await getGoogleAccessToken(userId) : null;
  const data = await ytFetch(
    "channels",
    { part: "snippet,statistics", id: channelId },
    token
  );
  const item = data.items?.[0];
  return item ? mapChannel(item) : null;
}

export async function searchChannels(query: string, userId?: string, max = 8): Promise<YtChannel[]> {
  const token = userId ? await getGoogleAccessToken(userId) : null;
  const search = await ytFetch(
    "search",
    {
      part: "snippet",
      type: "channel",
      q: query,
      maxResults: String(max),
    },
    token
  );
  const ids = (search.items || []).map((i: any) => i.snippet?.channelId || i.id?.channelId).filter(Boolean);
  if (!ids.length) return [];
  const data = await ytFetch(
    "channels",
    { part: "snippet,statistics", id: ids.join(",") },
    token
  );
  return (data.items || []).map(mapChannel);
}

export async function fetchRecentVideos(channelId: string, userId?: string, max = 10): Promise<YtVideo[]> {
  const token = userId ? await getGoogleAccessToken(userId) : null;
  const search = await ytFetch(
    "search",
    {
      part: "snippet",
      channelId,
      order: "date",
      type: "video",
      maxResults: String(max),
    },
    token
  );
  const ids = (search.items || []).map((i: any) => i.id?.videoId).filter(Boolean);
  if (!ids.length) return [];

  const data = await ytFetch(
    "videos",
    { part: "snippet,statistics", id: ids.join(",") },
    token
  );

  return (data.items || []).map((item: any) => {
    const sn = item.snippet || {};
    const st = item.statistics || {};
    return {
      id: item.id,
      title: sn.title || "",
      description: sn.description || "",
      publishedAt: sn.publishedAt || "",
      thumbnailUrl: sn.thumbnails?.medium?.url || sn.thumbnails?.default?.url,
      viewCount: Number(st.viewCount || 0),
      likeCount: Number(st.likeCount || 0),
      commentCount: Number(st.commentCount || 0),
      tags: sn.tags || [],
    } as YtVideo;
  });
}

export async function searchTrendingVideos(query: string, userId?: string, max = 12): Promise<YtVideo[]> {
  const token = userId ? await getGoogleAccessToken(userId) : null;
  const search = await ytFetch(
    "search",
    {
      part: "snippet",
      type: "video",
      q: query,
      order: "viewCount",
      maxResults: String(max),
      publishedAfter: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
    },
    token
  );
  const ids = (search.items || []).map((i: any) => i.id?.videoId).filter(Boolean);
  if (!ids.length) return [];
  const data = await ytFetch(
    "videos",
    { part: "snippet,statistics", id: ids.join(",") },
    token
  );
  return (data.items || []).map((item: any) => {
    const sn = item.snippet || {};
    const st = item.statistics || {};
    return {
      id: item.id,
      title: sn.title || "",
      description: sn.description || "",
      publishedAt: sn.publishedAt || "",
      thumbnailUrl: sn.thumbnails?.medium?.url || sn.thumbnails?.default?.url,
      viewCount: Number(st.viewCount || 0),
      likeCount: Number(st.likeCount || 0),
      commentCount: Number(st.commentCount || 0),
      tags: sn.tags || [],
    } as YtVideo;
  });
}

export function detectNiche(title: string, description: string, videoTitles: string[]): string {
  const text = `${title} ${description} ${videoTitles.join(" ")}`.toLowerCase();
  const niches: Record<string, string[]> = {
    texnologiya: ["tech", "ai", "telefon", "iphone", "android", "gadget", "dastur", "kompyuter", "it"],
    biznes: ["biznes", "pul", "marketing", "startup", "sotuv", "investitsiya", "money"],
    "ta'lim": ["dars", "organ", "tutorial", "kurs", "english", "til", "study", "education", "o'rgan"],
    "o'yin": ["game", "oyin", "gaming", "pubg", "minecraft", "gta", "stream", "o'yin"],
    lifestyle: ["hayot", "vlog", "daily", "motivation", "lifestyle", "travel", "sayohat"],
    oshxona: ["retsept", "ovqat", "cooking", "osh", "food", "kitchen"],
    shaxsiy_rivojlanish: ["motivation", "success", "habit", "productivity", "self"],
    yangiliklar: ["yangilik", "news", "breaking", "siasat", "world"],
  };

  let best = "umumiy kontent";
  let bestScore = 0;
  for (const [niche, keys] of Object.entries(niches)) {
    const score = keys.reduce((acc, k) => (text.includes(k) ? acc + 1 : acc), 0);
    if (score > bestScore) {
      bestScore = score;
      best = niche;
    }
  }
  return best;
}

export function analyzeChannelPerformance(videos: YtVideo[]) {
  if (!videos.length) {
    return {
      avgViews: 0,
      avgLikes: 0,
      topTitles: [] as string[],
      commonTags: [] as string[],
      postingInsight: "Hali video topilmadi. Kanalni to'ldirish kerak.",
      engagementRate: 0,
    };
  }

  const avgViews = Math.round(videos.reduce((s, v) => s + v.viewCount, 0) / videos.length);
  const avgLikes = Math.round(videos.reduce((s, v) => s + v.likeCount, 0) / videos.length);
  const engagementRate =
    avgViews > 0
      ? Number(
          (
            (videos.reduce((s, v) => s + v.likeCount + v.commentCount, 0) / videos.length / avgViews) *
            100
          ).toFixed(2)
        )
      : 0;

  const tagMap = new Map<string, number>();
  videos.forEach((v) => v.tags.forEach((t) => tagMap.set(t.toLowerCase(), (tagMap.get(t.toLowerCase()) || 0) + 1)));
  const commonTags = [...tagMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([t]) => t);

  const topTitles = [...videos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5).map((v) => v.title);

  return {
    avgViews,
    avgLikes,
    topTitles,
    commonTags,
    engagementRate,
    postingInsight:
      engagementRate >= 5
        ? "Auditoriya faol — qisqa hook va kuchli CTA bilan davom eting."
        : "Engagement pastroq — birinchi 3 sekunddagi hookni kuchaytiring.",
  };
}
