"use client";

import { motion } from "framer-motion";
import { Video, Wand2, TrendingUp, Clock, PlayCircle, Play, LogOut } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background Blobs */}
      <div className="blob bg-red-600/20 w-[500px] h-[500px] rounded-full top-[-10%] left-[-10%]" />
      <div className="blob bg-purple-600/20 w-[600px] h-[600px] rounded-full bottom-[-20%] right-[-10%]" />
      
      {/* Navigation Bar */}
      <nav className="absolute top-0 w-full glass px-8 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <Video className="w-8 h-8 text-red-500" />
          <span>AutoTube <span className="text-red-500">AI</span></span>
        </div>
        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-3">
              <img src={session.user?.image || ""} alt="Avatar" className="w-8 h-8 rounded-full border border-white/20" />
              <span className="text-sm font-medium hidden sm:block">{session.user?.name}</span>
              <button onClick={() => signOut()} className="text-gray-400 hover:text-white transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signIn("google")}
              className="bg-white/10 hover:bg-white/20 transition-all border border-white/10 text-white px-6 py-2 rounded-full font-medium flex items-center gap-2"
            >
              Kirish
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="z-10 flex flex-col items-center text-center px-4 max-w-4xl mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm text-gray-300"
        >
          <Wand2 className="w-4 h-4 text-purple-400" />
          Sun'iy intellekt orqali 100% avtomatlashtirilgan
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
        >
          YouTube Kanalingizni <br />
          <span className="text-gradient">Avtopilotga</span> O'tkazing
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed"
        >
          Trendlarni topishdan tortib, ssenariy yozish, video yaratish va uni eng yaxshi vaqtda yuklashgacha – barchasini AI tekinga bajaradi.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full justify-center"
        >
          {session ? (
            <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Boshqaruv Paneliga O'tish
            </button>
          ) : (
            <button 
              onClick={() => signIn("google")}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              Kanalni Ulash
            </button>
          )}
          <button className="glass hover:bg-white/10 px-8 py-4 rounded-full font-semibold text-lg transition-all flex items-center justify-center gap-2">
            <PlayCircle className="w-5 h-5" />
            Qanday ishlaydi?
          </button>
        </motion.div>
      </div>

      {/* Features Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full px-4 mt-32 mb-20"
      >
        <div className="glass-card p-8 rounded-3xl flex flex-col items-center text-center group hover:scale-[1.02] transition-transform">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:bg-purple-500/30 transition-colors">
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold mb-3">Trend Analitikasi</h3>
          <p className="text-gray-400 text-sm">Google Trends va YouTube orqali eng ommabop mavzularni avtomatik aniqlaymiz.</p>
        </div>

        <div className="glass-card p-8 rounded-3xl flex flex-col items-center text-center group hover:scale-[1.02] transition-transform">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-6 group-hover:bg-red-500/30 transition-colors">
            <Wand2 className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-bold mb-3">AI Kontent Generatsiyasi</h3>
          <p className="text-gray-400 text-sm">Ssenariy, sifatli ovoz (TTS), rasmlar va animatsiyali videolarni tekinga yaratamiz.</p>
        </div>

        <div className="glass-card p-8 rounded-3xl flex flex-col items-center text-center group hover:scale-[1.02] transition-transform">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:bg-blue-500/30 transition-colors">
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold mb-3">Avto-Yuklash (Schedule)</h3>
          <p className="text-gray-400 text-sm">Auditoriyangiz eng faol bo'ladigan vaqtni topib, videoni SEO-optimallashgan holda yuklaymiz.</p>
        </div>
      </motion.div>
    </main>
  );
}
