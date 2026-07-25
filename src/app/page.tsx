"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Video,
  Wand2,
  TrendingUp,
  Clock,
  PlayCircle,
  Play,
  LogOut,
  Swords,
  ScrollText,
  Clapperboard,
} from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";

const AUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    "Bu email oldin ro'yxatdan o'tgan, lekin Google akkaunti bog'lanmagan edi. Qayta «Kanalni Ulash» ni bosing — hozir tuzatildi.",
  Callback:
    "Google callback xatosi. Qayta urinib ko'ring. Agar takrorlansa, bizga xabar bering.",
  OAuthCallback: "Google ruxsatida xato. Qayta kiring.",
  AccessDenied: "Ruxsat rad etildi. YouTube ruxsatlarini ham belgilang.",
  Default: "Kirishda xatolik. Qayta urinib ko'ring.",
};

function AuthErrorBanner() {
  const params = useSearchParams();
  const error = params.get("error");
  const message = useMemo(() => {
    if (!error) return null;
    return AUTH_ERRORS[error] || AUTH_ERRORS.Default;
  }, [error]);

  if (!message) return null;

  return (
    <div className="fixed top-20 left-1/2 z-[60] w-[min(92vw,560px)] -translate-x-1/2 rounded-2xl border border-red-500/40 bg-red-950/90 px-4 py-3 text-sm text-red-100 shadow-xl backdrop-blur">
      {message}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { data: session } = useSession();

  const scrollToHow = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center overflow-hidden">
      <AuthErrorBanner />
      <div className="blob bg-red-600/20 w-[500px] h-[500px] rounded-full top-[-10%] left-[-10%]" />
      <div className="blob bg-orange-600/15 w-[600px] h-[600px] rounded-full bottom-[-20%] right-[-10%]" />

      <nav className="absolute top-0 w-full glass px-8 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <Video className="w-8 h-8 text-red-500" />
          <span>
            AutoTube <span className="text-red-500">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={session.user?.image || ""}
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-white/20"
              />
              <span className="text-sm font-medium hidden sm:block">{session.user?.name}</span>
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium hover:bg-red-500"
              >
                Panel
              </Link>
              <button
                onClick={() => signOut()}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="bg-white/10 hover:bg-white/20 transition-all border border-white/10 text-white px-6 py-2 rounded-full font-medium"
            >
              Kirish
            </button>
          )}
        </div>
      </nav>

      <div className="z-10 flex flex-col items-center text-center px-4 max-w-4xl mt-28 md:mt-36">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm text-gray-300"
        >
          <Wand2 className="w-4 h-4 text-orange-400" />
          Kanal tahlili · raqobatchilar · trend ssenariy · SEO · video paket
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
        >
          YouTube Kanalingizni <br />
          <span className="text-gradient">Avtopilotga</span> O&apos;tkazing
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed"
        >
          Kanalni ulang, nishani tahlil qiling, raqobatchilarni kuzating, trend ssenariy yozing va
          videoning nomi, hashtagi va tavsifini trendga moslab tayyorlang.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full justify-center"
        >
          {session ? (
            <Link
              href="/dashboard"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              Boshqaruv Paneliga O&apos;tish
            </Link>
          ) : (
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              Kanalni Ulash
            </button>
          )}
          <button
            onClick={scrollToHow}
            className="glass hover:bg-white/10 px-8 py-4 rounded-full font-semibold text-lg transition-all flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            Qanday ishlaydi?
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl w-full px-4 mt-28"
      >
        <Feature
          icon={TrendingUp}
          title="Kanal tahlili"
          desc="Obunachi, views, engagement va nisha avtomatik aniqlanadi."
          tone="orange"
        />
        <Feature
          icon={Swords}
          title="Raqobatchilar"
          desc="Nishadagi kanallarni kuzatib, ularning formatlarini o'rganasiz."
          tone="red"
        />
        <Feature
          icon={ScrollText}
          title="Trend ssenariy"
          desc="Hook, sahnlar, CTA va to'liq ssenariy bir tugmada."
          tone="amber"
        />
        <Feature
          icon={Clapperboard}
          title="SEO + video paket"
          desc="Nom, tavsif, hashtag, teg va thumbnail g'oya — yuklashga tayyor."
          tone="blue"
        />
      </motion.div>

      <section id="how-it-works" className="z-10 w-full max-w-4xl px-4 mt-24 mb-24">
        <div className="glass-card rounded-3xl p-8 md:p-10">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-red-400" />
            <h2 className="text-2xl font-bold">Qanday ishlaydi?</h2>
          </div>
          <ol className="space-y-4 text-left text-gray-300">
            <li>
              <span className="text-red-400 font-semibold">1.</span> Google orqali kiring va YouTube
              ruxsatini bering.
            </li>
            <li>
              <span className="text-red-400 font-semibold">2.</span> Dashboardda kanalni sinxronlang —
              tahlil tayyor bo&apos;ladi.
            </li>
            <li>
              <span className="text-red-400 font-semibold">3.</span> Raqobatchilarni qo&apos;shing va
              trend mavzularni oling.
            </li>
            <li>
              <span className="text-red-400 font-semibold">4.</span> Ssenariy yarating, SEO ni nusxa
              oling va video paketini montajga yuboring.
            </li>
          </ol>
        </div>
      </section>
    </main>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
  tone,
}: {
  icon: any;
  title: string;
  desc: string;
  tone: "orange" | "red" | "amber" | "blue";
}) {
  const tones = {
    orange: "bg-orange-500/20 text-orange-400",
    red: "bg-red-500/20 text-red-400",
    amber: "bg-amber-500/20 text-amber-400",
    blue: "bg-sky-500/20 text-sky-400",
  };
  return (
    <div className="glass-card p-8 rounded-3xl flex flex-col items-center text-center group hover:scale-[1.02] transition-transform">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${tones[tone]}`}>
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 text-sm">{desc}</p>
    </div>
  );
}
