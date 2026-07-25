"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Video,
  LayoutDashboard,
  Radio,
  Swords,
  ScrollText,
  Clapperboard,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Umumiy", icon: LayoutDashboard },
  { href: "/dashboard/channel", label: "Kanal tahlili", icon: Radio },
  { href: "/dashboard/competitors", label: "Raqobatchilar", icon: Swords },
  { href: "/dashboard/scripts", label: "Ssenariylar", icon: ScrollText },
  { href: "/dashboard/videos", label: "Videolar", icon: Clapperboard },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const Nav = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-6 font-bold tracking-tight">
        <Video className="h-7 w-7 text-red-500" />
        <span>
          AutoTube <span className="text-red-500">AI</span>
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-red-600/20 text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
        {/* Faqat 2 ta Asosiy Admin uchun ko'rinadigan Xavfsizlik sahifasi */}
        {session?.user?.email && ["muhammadaliuktamov42@gmail.com", "fieryscorpion259@gmail.com"].includes(session.user.email) && (
          <Link
            href="/dashboard/admin"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors mt-8 border border-blue-500/30",
              pathname === "/dashboard/admin"
                ? "bg-blue-600/20 text-blue-400"
                : "text-blue-500/70 hover:bg-blue-500/10 hover:text-blue-400"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><path d="m9 12 2 2 4-4"></path></svg>
            Xavfsizlik (Admin)
          </Link>
        )}
      </nav>
      <div className="border-t border-white/5 p-4">
        <div className="mb-3 flex items-center gap-3">
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="h-9 w-9 rounded-full" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-white/10" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{session?.user?.name}</p>
            <p className="truncate text-xs text-zinc-500">{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
        >
          <LogOut className="h-4 w-4" />
          Chiqish
        </button>
      </div>
    </div>
  );

  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    // Initialize
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#07070a] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-red-600/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl lg:block">
        {Nav}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-white/5 bg-[#0b0b10]">
            <button className="absolute right-3 top-4 p-2" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            {Nav}
          </aside>
        </div>
      )}

      {/* Kafolatlangan responsive padding */}
      <div 
        style={{ paddingLeft: isDesktop ? '256px' : '0px', transition: 'padding 0.3s ease' }} 
        className="w-full flex flex-col min-h-screen"
      >
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-black/30 px-4 py-3 backdrop-blur-xl lg:px-8">
          <button className="rounded-lg border border-white/10 p-2 lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm text-zinc-400">
            Kanal → tahlil → raqobatchi → ssenariy → SEO → video
          </p>
        </header>
        <main className="relative z-10 p-4 lg:p-8 w-full flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
