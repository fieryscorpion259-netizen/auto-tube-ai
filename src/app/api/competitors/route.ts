import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { fetchChannelById, fetchRecentVideos, searchChannels } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const competitors = await prisma.competitor.findMany({
    where: { userId: auth.userId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ competitors });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const action = body.action || "add";

    if (action === "search") {
      const q = String(body.query || "").trim();
      if (!q) return NextResponse.json({ error: "Qidiruv so'zi kerak" }, { status: 400 });
      const results = await searchChannels(q, auth.userId, 8);
      return NextResponse.json({ results });
    }

    if (action === "add") {
      const youtubeId = String(body.youtubeId || "").trim();
      if (!youtubeId) return NextResponse.json({ error: "youtubeId kerak" }, { status: 400 });

      const yt = await fetchChannelById(youtubeId, auth.userId);
      if (!yt) return NextResponse.json({ error: "Kanal topilmadi" }, { status: 404 });

      const videos = await fetchRecentVideos(youtubeId, auth.userId, 8);
      const primary = await prisma.channel.findFirst({
        where: { userId: auth.userId },
        orderBy: { updatedAt: "desc" },
      });

      const competitor = await prisma.competitor.upsert({
        where: {
          userId_youtubeId: { userId: auth.userId, youtubeId },
        },
        create: {
          userId: auth.userId,
          channelId: primary?.id,
          youtubeId: yt.id,
          title: yt.title,
          thumbnailUrl: yt.thumbnailUrl,
          subscriberCount: yt.subscriberCount,
          viewCount: yt.viewCount,
          videoCount: yt.videoCount,
          niche: primary?.niche,
          recentVideosJson: JSON.stringify(videos),
          lastSyncedAt: new Date(),
        },
        update: {
          title: yt.title,
          thumbnailUrl: yt.thumbnailUrl,
          subscriberCount: yt.subscriberCount,
          viewCount: yt.viewCount,
          videoCount: yt.videoCount,
          recentVideosJson: JSON.stringify(videos),
          lastSyncedAt: new Date(),
        },
      });

      return NextResponse.json({ competitor });
    }

    if (action === "refresh") {
      const id = String(body.id || "");
      const existing = await prisma.competitor.findFirst({
        where: { id, userId: auth.userId },
      });
      if (!existing) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

      const yt = await fetchChannelById(existing.youtubeId, auth.userId);
      const videos = await fetchRecentVideos(existing.youtubeId, auth.userId, 8);
      const competitor = await prisma.competitor.update({
        where: { id: existing.id },
        data: {
          title: yt?.title || existing.title,
          thumbnailUrl: yt?.thumbnailUrl || existing.thumbnailUrl,
          subscriberCount: yt?.subscriberCount || existing.subscriberCount,
          viewCount: yt?.viewCount || existing.viewCount,
          videoCount: yt?.videoCount || existing.videoCount,
          recentVideosJson: JSON.stringify(videos),
          lastSyncedAt: new Date(),
        },
      });
      return NextResponse.json({ competitor });
    }

    return NextResponse.json({ error: "Noma'lum action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Xatolik" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id kerak" }, { status: 400 });

  await prisma.competitor.deleteMany({ where: { id, userId: auth.userId } });
  return NextResponse.json({ ok: true });
}
