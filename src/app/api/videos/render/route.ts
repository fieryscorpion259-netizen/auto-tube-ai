import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const videoId = String(body.videoId || "");

    const video = await prisma.video.findFirst({
      where: { id: videoId, userId: auth.userId },
    });

    if (!video) {
      return NextResponse.json({ error: "Video topilmadi" }, { status: 404 });
    }

    const rawScenes = safeJsonParse<any[]>(video.scenesJson, []);
    if (!rawScenes.length) {
      return NextResponse.json({ error: "Videoda sahnalar yo'q" }, { status: 400 });
    }

    const processedScenes = rawScenes.map((scene: any, index: number) => {
      const promptText =
        scene.imagePrompt ||
        scene.visual ||
        `Creepy cinematic horror scene ${index + 1}, dark foggy atmosphere, 8k`;

      const encodedPrompt = encodeURIComponent(
        `${promptText}, ultra realistic, dark horror lighting, cinematic, 16:9`
      );

      const rawImageUrl =
        scene.imageUrl ||
        `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${
          index * 997 + 123
        }`;

      const imageUrl = rawImageUrl.startsWith("http")
        ? `/api/image-proxy?url=${encodeURIComponent(rawImageUrl)}`
        : rawImageUrl;

      const narrationText = scene.narration || scene.text || video.title;
      const audioUrl =
        scene.audioUrl || `/api/tts?text=${encodeURIComponent(narrationText.slice(0, 300))}`;

      return {
        ...scene,
        order: scene.order || index + 1,
        imageUrl,
        audioUrl,
        narration: narrationText,
        durationSec: scene.durationSec || 5,
      };
    });

    const updatedVideo = await prisma.video.update({
      where: { id: video.id },
      data: {
        scenesJson: JSON.stringify(processedScenes),
        status: "ready_to_play",
      },
    });

    return NextResponse.json({
      success: true,
      video: updatedVideo,
      scenes: processedScenes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Video render ma'lumotlarini tayyorlashda xato" },
      { status: 500 }
    );
  }
}
