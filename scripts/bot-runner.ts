import "dotenv/config";
import cron from "node-cron";
import { generateHorrorScript, generateImage, generateAudio, createSceneVideo, mergeScenes } from "../src/lib/horror-generator";
import { uploadToYouTube } from "../src/lib/youtube-upload";
import { prisma } from "../src/lib/prisma";
import fs from "fs/promises";
import path from "path";

const TMP_DIR = path.join(process.cwd(), "tmp");

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runVideoPipeline(userId: string) {
  try {
    console.log("🔥 [BOT] Video tayyorlash jarayoni boshlandi...");
    await fs.mkdir(TMP_DIR, { recursive: true });

    // 1. Ssenariy yaratish
    console.log("[1/5] Ssenariy yozilmoqda...");
    const apiKey = process.env.GEMINI_API_KEY || "";
    const script = await generateHorrorScript(apiKey);
    
    // 2. Prevyu rasm (Thumbnail) yaratish
    console.log("[2/5] Thumbnail yasalmoqda...");
    const thumbnailPath = path.join(TMP_DIR, "thumbnail.jpg");
    await generateImage(script.thumbnailPrompt, thumbnailPath, true);

    const sceneVideos: string[] = [];
    
    // 3. Sahnalarni generatsiya qilish (Rasm + Audio = Mini Video)
    console.log(`[3/5] Kadrlar va Ovoz yasalmoqda (${script.scenes.length} ta sahna)...`);
    for (let i = 0; i < script.scenes.length; i++) {
      const scene = script.scenes[i];
      const imagePath = path.join(TMP_DIR, `image_${i}.jpg`);
      const audioPath = path.join(TMP_DIR, `audio_${i}.mp3`);
      const videoPath = path.join(TMP_DIR, `scene_${i}.mp4`);

      await generateImage(scene.imagePrompt, imagePath, false);
      await generateAudio(scene.narration, audioPath);
      await createSceneVideo(imagePath, audioPath, videoPath, scene.isScary);
      
      sceneVideos.push(videoPath);
      console.log(`- Sahna ${i + 1} tayyor!`);
      await sleep(3000); // API limitga tushmaslik uchun 3 soniya kutamiz
    }

    // 4. Montaj qilish (Hammasini yopishtirish)
    console.log("[4/5] Videolar FFmpeg orqali montaj qilinmoqda...");
    const finalVideoPath = path.join(TMP_DIR, "final_horror_video.mp4");
    await mergeScenes(sceneVideos, finalVideoPath);

    // 5. YouTube'ga yuklash
    console.log("[5/5] YouTube'ga yuklanmoqda...");
    
    // Soat 18:00 (yoki 20:00) ga rejalashtirish
    const publishDate = new Date();
    publishDate.setHours(18, 0, 0, 0); 
    if (publishDate.getTime() < Date.now()) {
      publishDate.setDate(publishDate.getDate() + 1); // Agar vaqt o'tgan bo'lsa, ertangi kunga
    }

    const videoId = await uploadToYouTube(
      userId,
      finalVideoPath,
      thumbnailPath,
      script.title,
      script.description,
      ["horror", "scary story", "creepypasta", "true scary story"],
      publishDate
    );

    // 6. Bazaga saqlash
    await prisma.video.create({
      data: {
        userId,
        title: script.title,
        description: script.description,
        hashtags: "#horror #scarystory #creepypasta",
        tags: "horror, scary story, creepypasta",
        thumbnailIdea: script.thumbnailPrompt,
        scenesJson: JSON.stringify(script.scenes),
        status: "uploaded",
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      },
    });

    console.log(`✅ [BOT] MUAFFAQIYATLI! Video YouTube kanalingizga joylandi! Video ID: ${videoId}`);

  } catch (err) {
    console.error("❌ [BOT xatosi]:", err);
    throw err;
  }
}

// Botni har kuni taymerda ishga tushirish (Cron Job)
// Har kuni ertalab 10:00 da bot ishga tushadi, va 18:00 da chiqadigan qilib tayyorlab yuklaydi
export function startCronJobs(userId: string) {
  console.log("⏰ Cron bot yoqildi! Har kuni ishlaydi...");
  
  // 1-video: Har kuni soat 10:00 da tayyorlashni boshlaydi (18:00 da publish bo'ladi)
  cron.schedule("0 10 * * *", () => {
    runVideoPipeline(userId);
  });

  // 2-video: Har kuni soat 12:00 da tayyorlashni boshlaydi (20:00 da publish bo'ladi - koddagi vaqtni to'g'irlash orqali)
  cron.schedule("0 12 * * *", () => {
    // 2-video mantig'i ham chaqiriladi...
  });
}
