"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Eye, ThumbsUp, Hash } from "lucide-react";
import { formatNumber, safeJsonParse } from "@/lib/utils";

export default function ChannelPage() {
  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/channel");
      const json = await res.json();
      setChannel(json.channels?.[0] || null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function sync() {
    setSyncing(true);
    setError("");
    try {
      const res = await fetch("/api/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Xatolik");
      setChannel(json.channels?.[0] || null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p className="text-zinc-400">Yuklanmoqda...</p>;

  const analysis = safeJsonParse<any>(channel?.analysisJson, null);
  const videos = analysis?.recentVideos || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kanal tahlili</h1>
          <p className="mt-1 text-zinc-400">Nisha, metrikalar va eng yaxshi kontent formatlari</p>
        </div>
        <button
          onClick={sync}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold hover:bg-red-500 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          Sinxronlash
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {!channel ? (
        <div className="glass-card rounded-3xl p-8 text-center text-zinc-400">
          Kanal ulanmagan. Sinxronlash tugmasini bosing.
        </div>
      ) : (
        <>
          <div className="glass-card flex flex-col gap-6 rounded-3xl p-6 md:flex-row md:items-center">
            {channel.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={channel.thumbnailUrl} alt="" className="h-24 w-24 rounded-2xl object-cover" />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{channel.title}</h2>
              <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{channel.description}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-300">
                <span>{formatNumber(channel.subscriberCount)} obunachi</span>
                <span>{formatNumber(channel.viewCount)} ko'rish</span>
                <span>{channel.videoCount} video</span>
                <span className="rounded-full bg-red-600/20 px-3 py-0.5 text-red-300">
                  {channel.niche}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="O'rtacha views" value={formatNumber(analysis?.performance?.avgViews || 0)} icon={Eye} />
            <Metric label="O'rtacha likes" value={formatNumber(analysis?.performance?.avgLikes || 0)} icon={ThumbsUp} />
            <Metric label="Engagement" value={`${analysis?.performance?.engagementRate || 0}%`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-card rounded-3xl p-6">
              <h3 className="mb-4 text-lg font-semibold">Eng yaxshi sarlavhalar</h3>
              <ul className="space-y-2">
                {(analysis?.performance?.topTitles || []).map((t: string, i: number) => (
                  <li key={i} className="rounded-xl bg-white/5 px-3 py-2 text-sm">
                    {t}
                  </li>
                ))}
                {!analysis?.performance?.topTitles?.length && (
                  <li className="text-sm text-zinc-500">Ma'lumot yo'q</li>
                )}
              </ul>
            </div>
            <div className="glass-card rounded-3xl p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Hash className="h-4 w-4 text-red-400" />
                Tez-tez ishlatilgan teglar
              </h3>
              <div className="flex flex-wrap gap-2">
                {(analysis?.performance?.commonTags || []).map((t: string) => (
                  <span key={t} className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-300">
                    {t}
                  </span>
                ))}
                {!analysis?.performance?.commonTags?.length && (
                  <span className="text-sm text-zinc-500">Teglar topilmadi</span>
                )}
              </div>
              <p className="mt-4 text-sm text-zinc-400">{analysis?.performance?.postingInsight}</p>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6">
            <h3 className="mb-4 text-lg font-semibold">So'nggi videolar</h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {videos.map((v: any) => (
                <div key={v.id} className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03]">
                  {v.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnailUrl} alt="" className="aspect-video w-full object-cover" />
                  )}
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-medium">{v.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatNumber(v.viewCount)} views · {formatNumber(v.likeCount)} likes
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-2 flex items-center gap-2 text-sm text-zinc-400">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
