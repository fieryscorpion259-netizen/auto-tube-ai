import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { safeJsonParse } from "@/lib/utils";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const videos = await prisma.video.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
    include: { script: true },
  });
  return NextResponse.json({ videos });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const action = body.action || "from_script";

    if (action === "from_script") {
      const scriptId = String(body.scriptId || "");
      const script = await prisma.script.findFirst({
        where: { id: scriptId, userId: auth.userId },
      });
      if (!script) return NextResponse.json({ error: "Ssenariy topilmadi" }, { status: 404 });

      const scenes = safeJsonParse(script.scenesJson, []);
      const video = await prisma.video.create({
        data: {
          userId: auth.userId,
          channelId: script.channelId,
          scriptId: script.id,
          title: script.seoTitle || script.title,
          description: script.seoDescription || script.body.slice(0, 4000),
          hashtags: script.hashtags,
          tags: script.tags,
          thumbnailIdea:
            "Katta matn + kontrast fon + bitta emosional yuz/ikonka. CTR uchun savol yoki raqam qo'shing.",
          status: "ready",
          scenesJson: JSON.stringify(scenes),
          notes:
            "Video paketi tayyor: ssenariy sahnalari, SEO tavsif, hashtaglar. CapCut/Premiere yoki TTS+slideshow bilan yig'ing, keyin YouTube'ga yuklang.",
        },
      });

      await prisma.script.update({
        where: { id: script.id },
        data: { status: "produced" },
      });

      return NextResponse.json({ video });
    }

    if (action === "update_status") {
      const id = String(body.id || "");
      const status = String(body.status || "ready");
      const video = await prisma.video.updateMany({
        where: { id, userId: auth.userId },
        data: { status },
      });
      if (!video.count) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
      const updated = await prisma.video.findUnique({ where: { id } });
      return NextResponse.json({ video: updated });
    }

    return NextResponse.json({ error: "Noma'lum action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Xatolik" }, { status: 500 });
  }
}
