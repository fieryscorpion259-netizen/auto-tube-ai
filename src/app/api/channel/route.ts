import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  analyzeChannelPerformance,
  detectNiche,
  fetchMyChannels,
  fetchRecentVideos,
} from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const channels = await prisma.channel.findMany({
    where: { userId: auth.userId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ channels });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "sync";

    if (action === "sync") {
      const ytChannels = await fetchMyChannels(auth.userId);
      if (!ytChannels.length) {
        return NextResponse.json(
          { error: "YouTube kanal topilmadi. Google orqali YouTube ruxsatini berib qayta kiring." },
          { status: 404 }
        );
      }

      const saved = [];
      for (const yt of ytChannels) {
        const videos = await fetchRecentVideos(yt.id, auth.userId, 12);
        const niche = detectNiche(
          yt.title,
          yt.description,
          videos.map((v) => v.title)
        );
        const performance = analyzeChannelPerformance(videos);
        const analysis = {
          niche,
          performance,
          recentVideos: videos.slice(0, 8),
          syncedAt: new Date().toISOString(),
          recommendations: [
            `${niche} nishasida raqobatchilarni kuzating`,
            performance.topTitles[0]
              ? `Eng yaxshi format: «${performance.topTitles[0]}» uslubida davom eting`
              : "Birinchi 10 ta video bilan nisha sinovini boshlang",
            "Har videoda: kuchli hook + aniq CTA + trend hashtaglar",
          ],
        };

        const channel = await prisma.channel.upsert({
          where: {
            userId_youtubeId: { userId: auth.userId, youtubeId: yt.id },
          },
          create: {
            userId: auth.userId,
            youtubeId: yt.id,
            title: yt.title,
            description: yt.description,
            customUrl: yt.customUrl,
            thumbnailUrl: yt.thumbnailUrl,
            subscriberCount: yt.subscriberCount,
            viewCount: yt.viewCount,
            videoCount: yt.videoCount,
            niche,
            analysisJson: JSON.stringify(analysis),
            lastSyncedAt: new Date(),
          },
          update: {
            title: yt.title,
            description: yt.description,
            customUrl: yt.customUrl,
            thumbnailUrl: yt.thumbnailUrl,
            subscriberCount: yt.subscriberCount,
            viewCount: yt.viewCount,
            videoCount: yt.videoCount,
            niche,
            analysisJson: JSON.stringify(analysis),
            lastSyncedAt: new Date(),
          },
        });
        saved.push(channel);
      }

      return NextResponse.json({ channels: saved });
    }

    return NextResponse.json({ error: "Noma'lum action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Xatolik" }, { status: 500 });
  }
}
