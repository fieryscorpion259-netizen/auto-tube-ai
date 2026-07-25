"use client";

import { useEffect, useState } from "react";
import { Sparkles, Wand2, Copy, Check, Clapperboard } from "lucide-react";
import { safeJsonParse } from "@/lib/utils";

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<any[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [topic, setTopic] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/scripts");
    const json = await res.json();
    setScripts(json.scripts || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function suggest() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suggest" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Xatolik");
      setTopics(json.topics || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function generate(customTopic?: string) {
    const t = (customTopic || topic).trim();
    if (!t) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", topic: t }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Generatsiya xatosi");
      setSelected(json.script);
      setTopic("");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function makeVideo(scriptId: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "from_script", scriptId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Video yaratilmadi");
      window.location.href = "/dashboard/videos";
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function copyText(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  }

  const scenes = safeJsonParse<any[]>(selected?.scenesJson, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Ssenariylar & SEO</h1>
        <p className="mt-1 text-zinc-400">
          Trend mavzu → ssenariy → nom, tavsif, hashtag — hammasi bir joyda
        </p>
      </div>

      <div className="glass-card rounded-3xl p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Mavzu yozing... masalan: AI bilan YouTube o'stirish"
            className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-red-500/50"
          />
          <button
            onClick={() => generate()}
            disabled={busy || !topic.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold hover:bg-red-500 disabled:opacity-60"
          >
            <Wand2 className="h-4 w-4" />
            Ssenariy yaratish
          </button>
          <button
            onClick={suggest}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-3 text-sm hover:bg-white/5 disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4 text-orange-400" />
            Trend mavzular
          </button>
        </div>

        {!!topics.length && (
          <div className="mt-4 flex flex-wrap gap-2">
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => generate(t)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-left text-xs hover:bg-white/10"
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-3 xl:col-span-2">
          <h2 className="text-lg font-semibold">Saqlangan ssenariylar</h2>
          {loading ? (
            <p className="text-sm text-zinc-500">Yuklanmoqda...</p>
          ) : !scripts.length ? (
            <p className="text-sm text-zinc-500">Hali ssenariy yo'q</p>
          ) : (
            scripts.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  selected?.id === s.id
                    ? "border-red-500/40 bg-red-500/10"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                <p className="line-clamp-2 text-sm font-medium">{s.title}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Trend {s.trendScore}/100 · {s.status}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="glass-card rounded-3xl p-6 xl:col-span-3">
          {!selected ? (
            <p className="text-zinc-500">Ssenariy tanlang yoki yangi yarating</p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{selected.seoTitle || selected.title}</h2>
                  <p className="mt-1 text-sm text-zinc-400">Mavzu: {selected.topic}</p>
                </div>
                <button
                  onClick={() => makeVideo(selected.id)}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-zinc-200 disabled:opacity-60"
                >
                  <Clapperboard className="h-4 w-4" />
                  Videoga aylantirish
                </button>
              </div>

              <Block
                title="Hook"
                text={selected.hook || ""}
                copied={copied === "hook"}
                onCopy={() => copyText("hook", selected.hook || "")}
              />
              <Block
                title="SEO Title"
                text={selected.seoTitle || ""}
                copied={copied === "title"}
                onCopy={() => copyText("title", selected.seoTitle || "")}
              />
              <Block
                title="Tavsif"
                text={selected.seoDescription || ""}
                copied={copied === "desc"}
                onCopy={() => copyText("desc", selected.seoDescription || "")}
              />
              <Block
                title="Hashtaglar"
                text={selected.hashtags || ""}
                copied={copied === "hash"}
                onCopy={() => copyText("hash", selected.hashtags || "")}
              />
              <Block
                title="Teglar"
                text={selected.tags || ""}
                copied={copied === "tags"}
                onCopy={() => copyText("tags", selected.tags || "")}
              />

              <div>
                <h3 className="mb-3 font-semibold">Sahnalar</h3>
                <div className="space-y-3">
                  {scenes.map((scene) => (
                    <div key={scene.order} className="rounded-2xl bg-white/5 p-4">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {scene.order}. {scene.title}
                        </span>
                        <span className="text-xs text-zinc-500">{scene.durationSec}s</span>
                      </div>
                      <p className="text-sm text-zinc-300">{scene.narration}</p>
                      <p className="mt-2 text-xs text-zinc-500">Visual: {scene.visual}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Block
                title="To'liq ssenariy"
                text={selected.body || ""}
                copied={copied === "body"}
                onCopy={() => copyText("body", selected.body || "")}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Block({
  title,
  text,
  onCopy,
  copied,
}: {
  title: string;
  text: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">{title}</h3>
        <button onClick={onCopy} className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white">
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Nusxa olindi" : "Nusxa"}
        </button>
      </div>
      <pre className="whitespace-pre-wrap rounded-2xl bg-black/40 p-4 text-sm text-zinc-200">{text}</pre>
    </div>
  );
}
