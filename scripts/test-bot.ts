import "dotenv/config";
import { prisma } from "../src/lib/prisma";
// @ts-ignore
import { runVideoPipeline } from "./bot-runner";

async function runTest() {
  console.log("🔍 Bazadan sizning profilingiz qidirilmoqda...");
  
  // Bazadagi eng birinchi google orqali kirgan foydalanuvchini topish
  const account = await prisma.account.findFirst({
    where: { provider: "google" }
  });

  if (!account) {
    console.log("❌ XATOLIK: Siz hali saytga Google orqali kirmagansiz!");
    console.log("👉 Iltimos, oldin 'npm run dev' orqali saytni yoqing va Google bilan kiring.");
    return;
  }

  console.log(`✅ Profil topildi! (UserID: ${account.userId}). Avtomat bot hoziroq ishga tushirilmoqda...`);
  
  // Botni kutib o'tirmasdan hoziroq bitta video yasashga majburlab ishga tushiramiz
  await runVideoPipeline(account.userId);
  console.log("TEST YAKUNLANDI!");
}

runTest();
