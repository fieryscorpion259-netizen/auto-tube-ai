"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Trash2, RefreshCw } from "lucide-react";
import { formatNumber, safeJsonParse } from "@/lib/utils";

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/competitors");
    const json = await res.json();
    setCompetitors(json.competitors || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function search() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", query }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Qidiruv xatosi");
      setResults(json.results || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function add(youtubeId: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", youtubeId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Qo'shib bo'lmadi");
      setResults([]);
      setQuery("");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function refresh(id: string) {
    setBusy(true);
    try {
      await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh", id }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/competitors?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Raqobatchilar</h1>
        <p className="mt-1 text-zinc-400">Nisha bo'yicha kanallarni kuzating va trend formatlarni oling</p>
      </div>

      <div className="glass-card rounded-3xl p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Masalan: AI uzbek, business tips, tech review..."
              className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-sm outline-none focus:border-red-500/50"
            />
          </div>
          <button
            onClick={search}
            disabled={busy || !query.trim()}
            className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold hover:bg-red-500 disabled:opacity-60"
          >
            Qidirish
          </button>
        </div>

        {!!results.length && (
          <div className="mt-4 space-y-2">
            {results.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-3 py-2">
                <div className="flex items-center gap-3 min-w-0">
                  {r.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.thumbnailUrl} alt="" className="h-10 w-10 rounded-full" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-zinc-500">{formatNumber(r.subscriberCount)} obunachi</p>
                  </div>
                </div>
                <button
                  onClick={() => add(r.id)}
                  className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3 py-1.5 text-xs hover:bg-white/10"
                >
                  <Plus className="h-3.5 w-3.5" /> Qo'shish
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-zinc-400">Yuklanmoqda...</p>
      ) : !competitors.length ? (
        <div className="glass-card rounded-3xl p-8 text-center text-zinc-400">
          Hali raqobatchi yo'q. Yuqoridan qidirib qo'shing.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {competitors.map((c) => {
            const videos = safeJsonParse<any[]>(c.recentVideosJson, []);
            return (
              <div key={c.id} className="glass-card rounded-3xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {c.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.thumbnailUrl} alt="" className="h-12 w-12 rounded-full" />
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{c.title}</h3>
                      <p className="text-xs text-zinc-500">
                        {formatNumber(c.subscriberCount)} obunachi · {formatNumber(c.viewCount)} views
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => refresh(c.id)} className="rounded-lg border border-white/10 p-2 hover:bg-white/5">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(c.id)} className="rounded-lg border border-white/10 p-2 hover:bg-white/5">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">So'nggi videolar</p>
                  {videos.slice(0, 4).map((v) => (
                    <div key={v.id} className="rounded-xl bg-white/5 px-3 py-2 text-sm">
                      <p className="line-clamp-1">{v.title}</p>
                      <p className="text-xs text-zinc-500">{formatNumber(v.viewCount)} views</p>
                    </div>
                  ))}
                  {!videos.length && <p className="text-sm text-zinc-500">Video yo'q</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
