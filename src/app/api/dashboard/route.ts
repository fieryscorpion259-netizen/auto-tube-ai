import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { safeJsonParse } from "@/lib/utils";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const [channels, competitors, scripts, videos] = await Promise.all([
    prisma.channel.findMany({ where: { userId: auth.userId }, orderBy: { updatedAt: "desc" } }),
    prisma.competitor.findMany({ where: { userId: auth.userId }, orderBy: { updatedAt: "desc" } }),
    prisma.script.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.video.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const primary = channels[0];
  const analysis = safeJsonParse<any>(primary?.analysisJson, null);

  return NextResponse.json({
    summary: {
      channelCount: channels.length,
      competitorCount: competitors.length,
      scriptCount: await prisma.script.count({ where: { userId: auth.userId } }),
      videoCount: await prisma.video.count({ where: { userId: auth.userId } }),
      niche: primary?.niche || null,
      subscribers: primary?.subscriberCount || 0,
    },
    channel: primary,
    analysis,
    competitors: competitors.slice(0, 5),
    scripts,
    videos,
  });
}
