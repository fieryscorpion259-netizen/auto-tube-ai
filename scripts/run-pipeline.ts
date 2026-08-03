import "dotenv/config";
import { prisma } from "../src/lib/prisma";
// @ts-ignore
import { runVideoPipeline } from "./bot-runner";

async function executeBot() {
  console.log("=========================================");
  console.log("🚀 GITHUB ACTIONS: AUTO-TUBE AI BOT ISHGA TUSHDI!");
  console.log("=========================================");
  
  // 1. Keraksiz 0622753980k@gmail.com profilini va uning akkauntlarini bazadan to'liq o'chirish
  try {
    const deleted = await prisma.user.deleteMany({
      where: { email: { equals: "0622753980k@gmail.com", mode: "insensitive" } }
    });
    if (deleted.count > 0) {
      console.log(`🗑️ 0622753980k@gmail.com akkaunti bazadan o'chirildi (${deleted.count} ta)!`);
    }
  } catch (e: any) {
    console.warn("Eski profilni o'chirishda ogohlantirish:", e.message);
  }

  // 2. Bazadagi to'g'ri (DreamNest AI) Google akkauntni topish
  const account = await prisma.account.findFirst({
    where: {
      provider: "google",
      user: {
        email: { not: "0622753980k@gmail.com" }
      }
    },
    include: { user: true },
    orderBy: { id: "desc" }
  });

  if (!account) {
    console.error("❌ XATOLIK: Bazada DreamNest AI Google akkaunti topilmadi! Iltimos saytga DreamNest AI email'ingiz bilan 1 marta kiring.");
    process.exit(1);
  }

  console.log(`✅ To'g'ri profil topildi! (Email: ${account.user?.email || account.userId}). Video yaratish jarayoni boshlanmoqda...`);
  
  // Botni 1 marta ishga tushirish va yakunlash
  await runVideoPipeline(account.userId);
  
  console.log("✅ GITHUB ACTIONS: Jarayon muvaffaqiyatli yakunlandi. Dastur yopilmoqda.");
  process.exit(0);
}

executeBot();
