import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { generateHorrorScript } from "@/lib/horror-generator";

export const maxDuration = 60; // Vercel 60s limit

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  try {
    const apiKey = process.env.GEMINI_API_KEY || "";
    console.log(`[UI] Video tayyorlash boshlandi (User: ${auth.userId})...`);

    // 1. AI orqali to'liq ssenariy va kadrlar yaratish
    const scriptData = await generateHorrorScript(apiKey);

    // 2. Kanalni aniqlash
    const channel = await prisma.channel.findFirst({
      where: { userId: auth.userId },
      orderBy: { updatedAt: "desc" },
    });

    // 3. Ssenariyni bazaga saqlash
    const script = await prisma.script.create({
      data: {
        userId: auth.userId,
        channelId: channel?.id,
        title: scriptData.title,
        topic: scriptData.title,
        niche: channel?.niche || "Horror",
        hook: scriptData.scenes?.[0]?.narration || scriptData.title,
        body: scriptData.description,
        cta: "Kanalga obuna bo'ling!",
        scenesJson: JSON.stringify(scriptData.scenes || []),
        seoTitle: scriptData.title,
        seoDescription: scriptData.description,
        hashtags: "#horror #scarystories #creepypasta #stories",
        tags: "horror,scary,creepypasta,stories,scarystory",
        trendScore: 98,
        status: "produced",
      },
    });

    // 4. Video paketini bazaga saqlash
    const video = await prisma.video.create({
      data: {
        userId: auth.userId,
        channelId: channel?.id,
        scriptId: script.id,
        title: scriptData.title,
        description: scriptData.description,
        hashtags: "#horror #scarystories #creepypasta",
        tags: "horror,scary,creepypasta",
        thumbnailIdea: scriptData.thumbnailPrompt || "Qorong'u o'rmon va qizil ko'zlar",
        status: "auto_generated",
        scenesJson: JSON.stringify(scriptData.scenes || []),
        notes: `AI Video paketi muvaffaqiyatli tayyorlandi! ${scriptData.scenes?.length || 0} ta sahna va SEO paket shakllantirildi.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Video paketi va ssenariy muvaffaqiyatli tayyorlandi!",
      video,
    });
  } catch (error: any) {
    console.error("UI Video yaratishda xato:", error);
    return NextResponse.json(
      { error: error.message || "Video tayyorlashda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
