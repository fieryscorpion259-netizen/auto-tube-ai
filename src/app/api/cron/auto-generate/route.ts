import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateContentPackage, suggestTopics } from "@/lib/ai";
import { fetchRecentVideos, analyzeChannelPerformance } from "@/lib/youtube";

export const maxDuration = 60; // Allow 60s for Vercel Serverless Function

export async function GET(req: Request) {
  // Authorization check (Vercel Cron security or CRON_SECRET)
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const channels = await prisma.channel.findMany({
      include: {
        user: true,
        competitors: true,
      },
    });

    const results = [];

    for (const channel of channels) {
      try {
        // 1. Fetch channel's recent videos to get top performing topics
        const recent = await fetchRecentVideos(channel.youtubeId, channel.userId, 10).catch(() => []);
        const performance = analyzeChannelPerformance(recent);
        
        const competitorTitles: string[] = [];
        for (const comp of channel.competitors) {
          if (comp.recentVideosJson) {
            try {
              const videos = JSON.parse(comp.recentVideosJson);
              competitorTitles.push(...videos.map((v: any) => v.title));
            } catch {}
          }
        }

        // 2. Suggest trend topic for today
        const topics = suggestTopics(channel.niche || "General", competitorTitles, performance.topTitles);
        const todayTopic = topics[0] || `${channel.niche || "Trending"} bugungi eng dolzarb mavzu`;

        // 3. Generate Content Package via AI (Gemini / OpenAI)
        const pkg = await generateContentPackage({
          topic: todayTopic,
          niche: channel.niche || "General",
          channelTitle: channel.title,
          language: channel.language || "uz",
          competitorInsights: competitorTitles.slice(0, 3),
          trendHints: performance.topTitles.slice(0, 3),
        });

        // 4. Save Script to Database
        const script = await prisma.script.create({
          data: {
            userId: channel.userId,
            channelId: channel.id,
            title: pkg.seoTitle,
            topic: pkg.topic,
            niche: channel.niche,
            hook: pkg.hook,
            body: pkg.body,
            cta: pkg.cta,
            scenesJson: JSON.stringify(pkg.scenes),
            seoTitle: pkg.seoTitle,
            seoDescription: pkg.seoDescription,
            hashtags: pkg.hashtags.join(" "),
            tags: pkg.tags.join(","),
            trendScore: pkg.trendScore,
            status: "produced",
          },
        });

        // 5. Create Video Package in Database
        const video = await prisma.video.create({
          data: {
            userId: channel.userId,
            channelId: channel.id,
            scriptId: script.id,
            title: pkg.seoTitle,
            description: pkg.seoDescription,
            hashtags: pkg.hashtags.join(" "),
            tags: pkg.tags.join(","),
            thumbnailIdea: pkg.thumbnailIdea,
            status: "auto_generated",
            scenesJson: JSON.stringify(pkg.scenes),
            notes: "Bugungi kunlik avtomatik tayyorlangan video paketi.",
          },
        });

        results.push({
          channel: channel.title,
          videoId: video.id,
          title: video.title,
          status: "success",
        });
      } catch (err: any) {
        console.error(`Avto video yaratishda xato (${channel.title}):`, err);
        results.push({
          channel: channel.title,
          error: err.message,
          status: "failed",
        });
      }
    }

    return NextResponse.json({
      message: "Kunlik avtomatik video tayyorlash yakunlandi",
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
