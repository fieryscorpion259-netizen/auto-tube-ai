import { google } from "googleapis";
import fs from "fs";
import { prisma } from "./prisma";

// YouTube OAuth 2.0 ulanishi
async function getAuthClient(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });
  
  if (!account || !account.refresh_token) {
    throw new Error("Google hisobi ulanmagan yoki refresh token yo'q");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at ? account.expires_at * 1000 : null,
  });

  return oauth2Client;
}

// Videoni yuklash funksiyasi
export async function uploadToYouTube(
  userId: string,
  videoPath: string,
  thumbnailPath: string,
  title: string,
  description: string,
  tags: string[],
  publishAtDate?: Date
) {
  const auth = await getAuthClient(userId);
  const youtube = google.youtube({ version: "v3", auth });

  console.log("Videoni yuklash boshlandi...");

  // 1. Videoni to'g'ridan-to'g'ri PUBLIC (Ommaviy) shaklda yuklash
  const videoRes = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title,
        description,
        tags,
        categoryId: "24", // Entertainment
      },
      status: {
        privacyStatus: "public",
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(videoPath),
    },
  });

  const videoId = videoRes.data.id;
  if (!videoId) throw new Error("Video yuklanmadi");
  console.log("Video muvaffaqiyatli YouTube'ga yuklandi! ID:", videoId);

  // 2. Thumbnail (Prevyu) qo'yish
  if (thumbnailPath && fs.existsSync(thumbnailPath)) {
    try {
      console.log("Prevyu (Thumbnail) yuklanmoqda...");
      await youtube.thumbnails.set({
        videoId,
        media: {
          body: fs.createReadStream(thumbnailPath),
        },
      });
      console.log("Prevyu o'rnatildi!");
    } catch (e: any) {
      console.warn("Thumbnail yuklashda ogohlantirish (kanalda ruxsat bo'lmasligi mumkin):", e.message);
    }
  }

  return videoId;
}
