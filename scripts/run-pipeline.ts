import "dotenv/config";
import { prisma } from "../src/lib/prisma";
// @ts-ignore
import { runVideoPipeline } from "./bot-runner";

async function executeBot() {
  console.log("=========================================");
  console.log("🚀 GITHUB ACTIONS: AUTO-TUBE AI BOT ISHGA TUSHDI!");
  console.log("=========================================");
  
  // Bazadagi eng oxirgi (yangi) google orqali kirgan foydalanuvchini topish (DreamNest AI)
  const account = await prisma.account.findFirst({
    where: { provider: "google" },
    orderBy: { id: "desc" }
  });

  if (!account) {
    console.error("❌ XATOLIK: Bazada Google akkaunt topilmadi!");
    process.exit(1);
  }

  console.log(`✅ Profil topildi! (UserID: ${account.userId}). Video yaratish jarayoni boshlanmoqda...`);
  
  // Botni 1 marta ishga tushirish va yakunlash
  await runVideoPipeline(account.userId);
  
  console.log("✅ GITHUB ACTIONS: Jarayon muvaffaqiyatli yakunlandi. Dastur yopilmoqda.");
  process.exit(0);
}

executeBot();
