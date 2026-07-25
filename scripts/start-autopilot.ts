import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { startCronJobs } from "./bot-runner";

async function runAutopilot() {
  console.log("=========================================");
  console.log("🚀 AUTO-TUBE AI AVTOPILOT TIZIMI ISHGA TUSHDI!");
  console.log("=========================================");
  
  console.log("🔍 YouTube akkauntingiz bazadan qidirilmoqda...");
  
  // Bazadagi eng birinchi google orqali kirgan foydalanuvchini topish (Sizning akkauntingiz)
  const account = await prisma.account.findFirst({
    where: { provider: "google" }
  });

  if (!account) {
    console.log("❌ XATOLIK: Siz hali saytga Google orqali kirmagansiz!");
    console.log("👉 Iltimos, oldin 'npm run dev' orqali saytni yoqing va Google bilan kiring.");
    process.exit(1);
  }

  console.log(`✅ Profil topildi! (UserID: ${account.userId}).`);
  
  // Cron (Taymer) larni ishga tushirish
  startCronJobs(account.userId);
  
  console.log("\n✅ Tizim to'liq mustaqil ish rejimiga o'tdi.");
  console.log("Bu oyna ochiq turgan vaqtda bot 24/7 ishlaydi va odam aralashuvisiz:");
  console.log(" - Har kuni soat 10:00 da AI ssenariy yozishni boshlaydi.");
  console.log(" - Rasmlarni yasaydi va daxshatli ovozlar qo'shib montaj qiladi.");
  console.log(" - Kechqurun 18:00 (Praim Taym) da o'zi YouTube ga muqova va SEO bilan joylaydi.");
  console.log("Ushbu oynani yopib yuborsangiz, Avtopilot ham to'xtaydi.\n");
}

runAutopilot();
