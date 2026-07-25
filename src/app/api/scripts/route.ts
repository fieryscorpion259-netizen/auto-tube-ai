import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { generateContentPackage, suggestTopics } from "@/lib/ai";
import { searchTrendingVideos } from "@/lib/youtube";
import { safeJsonParse } from "@/lib/utils";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const scripts = await prisma.script.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ scripts });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const action = body.action || "generate";

    const channel = await prisma.channel.findFirst({
      where: { userId: auth.userId },
      orderBy: { updatedAt: "desc" },
    });

    const competitors = await prisma.competitor.findMany({
      where: { userId: auth.userId },
      take: 5,
    });

    const competitorTitles = competitors.flatMap((c) => {
      const videos = safeJsonParse<any[]>(c.recentVideosJson, []);
      return videos.map((v) => v.title).filter(Boolean);
    });

    if (action === "suggest") {
      const niche = channel?.niche || body.niche || "umumiy kontent";
      let trendTitles: string[] = [];
      try {
        const trends = await searchTrendingVideos(niche, auth.userId, 10);
        trendTitles = trends.map((t) => t.title);
      } catch {
        trendTitles = [];
      }
      const topics = suggestTopics(niche, competitorTitles, trendTitles);
      return NextResponse.json({ topics, niche, trendTitles: trendTitles.slice(0, 5) });
    }

    if (action === "generate") {
      const topic = String(body.topic || "").trim();
      if (!topic) return NextResponse.json({ error: "Mavzu kerak" }, { status: 400 });
      const niche = String(body.niche || channel?.niche || "umumiy kontent");

      let trendHints: string[] = [];
      try {
        const trends = await searchTrendingVideos(`${niche} ${topic}`, auth.userId, 6);
        trendHints = trends.slice(0, 3).map((t) => `${t.title} (${t.viewCount} views)`);
      } catch {
        trendHints = [];
      }

      const pack = await generateContentPackage({
        topic,
        niche,
        channelTitle: channel?.title,
        language: channel?.language || "uz",
        competitorInsights: competitorTitles.slice(0, 5),
        trendHints,
      });

      const script = await prisma.script.create({
        data: {
          userId: auth.userId,
          channelId: channel?.id,
          title: pack.seoTitle,
          topic: pack.topic,
          niche,
          hook: pack.hook,
          body: pack.body,
          cta: pack.cta,
          scenesJson: JSON.stringify(pack.scenes),
          seoTitle: pack.seoTitle,
          seoDescription: pack.seoDescription,
          hashtags: pack.hashtags.join(" "),
          tags: pack.tags.join(", "),
          trendScore: pack.trendScore,
          status: "ready",
        },
      });

      return NextResponse.json({ script, package: pack });
    }

    return NextResponse.json({ error: "Noma'lum action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Xatolik" }, { status: 500 });
  }
}
