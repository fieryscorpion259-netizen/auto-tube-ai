"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Radio,
  Swords,
  ScrollText,
  Clapperboard,
  RefreshCw,
  TrendingUp,
  Users,
  Eye,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

type Dash = {
  summary: {
    channelCount: number;
    competitorCount: number;
    scriptCount: number;
    videoCount: number;
    niche: string | null;
    subscribers: number;
  };
  channel: any;
  analysis: any;
  competitors: any[];
  scripts: any[];
  videos: any[];
};

export default function DashboardPage() {
  const [data, setData] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Yuklash xatosi");
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function syncChannel() {
    setSyncing(true);
    setError("");
    try {
      const res = await fetch("/api/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sync xatosi");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="text-zinc-400">Dashboard yuklanmoqda...</div>;
  }

  const s = data?.summary;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Boshqaruv paneli</h1>
          <p className="mt-1 text-zinc-400">
            {data?.channel
              ? `${data.channel.title} · nisha: ${data.channel.niche || "aniqlanmagan"}`
              : "Avval YouTube kanalini ulang"}
          </p>
        </div>
        <button
          onClick={syncChannel}
          disabled={syncing}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold hover:bg-red-500 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Ulanmoqda..." : "Kanalni yangilash / ulash"}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Obunachilar", value: formatNumber(s?.subscribers || 0), icon: Users },
          { label: "Raqobatchilar", value: s?.competitorCount || 0, icon: Swords },
          { label: "Ssenariylar", value: s?.scriptCount || 0, icon: ScrollText },
          { label: "Videolar", value: s?.videoCount || 0, icon: Clapperboard },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass-card rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-zinc-400">{label}</span>
              <Icon className="h-4 w-4 text-red-400" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {!data?.channel ? (
        <div className="glass-card rounded-3xl p-8 text-center">
          <Radio className="mx-auto mb-4 h-10 w-10 text-red-400" />
          <h2 className="text-xl font-semibold">YouTube kanalini ulang</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-400">
            Google orqali kirganingizda YouTube ruxsati berilgan bo‘lsa, «Kanalni yangilash / ulash»
            tugmasi kanalni tortib, nisha va kontent tahlilini yaratadi.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="glass-card rounded-3xl p-6 lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-400" />
              <h2 className="text-lg font-semibold">Kanal tahlili</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="O'rtacha ko'rish" value={formatNumber(data.analysis?.performance?.avgViews || 0)} icon={Eye} />
              <Stat label="Engagement" value={`${data.analysis?.performance?.engagementRate || 0}%`} />
              <Stat label="Nisha" value={data.channel.niche || "—"} />
            </div>
            <p className="mt-4 text-sm text-zinc-300">
              {data.analysis?.performance?.postingInsight || "Tahlil yangilanmagan."}
            </p>
            {!!data.analysis?.recommendations?.length && (
              <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                {data.analysis.recommendations.map((r: string, i: number) => (
                  <li key={i} className="rounded-xl bg-white/5 px-3 py-2">
                    {r}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/dashboard/channel" className="mt-4 inline-block text-sm text-red-400 hover:text-red-300">
              To'liq tahlil →
            </Link>
          </div>

          <div className="glass-card rounded-3xl p-6">
            <h2 className="mb-4 text-lg font-semibold">Tezkor amallar</h2>
            <div className="space-y-3">
              <Quick href="/dashboard/competitors" title="Raqobatchi qo'shish" desc="Nisha bo'yicha kuzatuv" />
              <Quick href="/dashboard/scripts" title="Trend ssenariy" desc="AI ssenariy + SEO" />
              <Quick href="/dashboard/videos" title="Video paketi" desc="Ssenariydan video tayyorlash" />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ListCard
          title="So'nggi ssenariylar"
          empty="Hali ssenariy yo'q"
          items={(data?.scripts || []).map((s) => ({
            id: s.id,
            title: s.title,
            meta: `Trend ${s.trendScore}/100`,
          }))}
          href="/dashboard/scripts"
        />
        <ListCard
          title="So'nggi videolar"
          empty="Hali video yo'q"
          items={(data?.videos || []).map((v) => ({
            id: v.id,
            title: v.title,
            meta: v.status,
          }))}
          href="/dashboard/videos"
        />
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function Quick({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06]">
      <div className="font-medium">{title}</div>
      <div className="text-sm text-zinc-500">{desc}</div>
    </Link>
  );
}

function ListCard({
  title,
  empty,
  items,
  href,
}: {
  title: string;
  empty: string;
  items: { id: string; title: string; meta: string }[];
  href: string;
}) {
  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link href={href} className="text-sm text-red-400">
          Hammasi
        </Link>
      </div>
      {!items.length ? (
        <p className="text-sm text-zinc-500">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/5 px-3 py-2.5">
              <span className="text-sm">{item.title}</span>
              <span className="shrink-0 text-xs text-zinc-500">{item.meta}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
