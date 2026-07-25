"use client";

import { useEffect, useState } from "react";
import { Clapperboard, Copy, Check } from "lucide-react";
import { safeJsonParse } from "@/lib/utils";

export default function VideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/videos");
    const json = await res.json();
    setVideos(json.videos || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: string) {
    await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_status", id, status }),
    });
    await load();
    if (selected?.id === id) {
      setSelected({ ...selected, status });
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
        <h1 className="text-3xl font-bold">Video paketlar</h1>
        <p className="mt-1 text-zinc-400">
          Ssenariy asosida tayyor paket: sahnalar, SEO, thumbnail g'oya — yuklashga tayyor
        </p>
      </div>

      {loading ? (
        <p className="text-zinc-400">Yuklanmoqda...</p>
      ) : !videos.length ? (
        <div className="glass-card rounded-3xl p-10 text-center">
          <Clapperboard className="mx-auto mb-4 h-10 w-10 text-red-400" />
          <p className="text-zinc-300">Hali video paketi yo'q</p>
          <p className="mt-2 text-sm text-zinc-500">
            Avval Ssenariylar bo'limida kontent yarating, keyin «Videoga aylantirish»ni bosing.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-5">
          <div className="space-y-3 xl:col-span-2">
            {videos.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelected(v)}
                className={`w-full rounded-2xl border px-4 py-3 text-left ${
                  selected?.id === v.id
                    ? "border-red-500/40 bg-red-500/10"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                <p className="line-clamp-2 text-sm font-medium">{v.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{v.status}</p>
              </button>
            ))}
          </div>

          <div className="glass-card rounded-3xl p-6 xl:col-span-3">
            {!selected ? (
              <p className="text-zinc-500">Videoni tanlang</p>
            ) : (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold">{selected.title}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{selected.notes}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {["ready", "editing", "uploaded", "scheduled"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatus(selected.id, st)}
                      className={`rounded-full px-3 py-1 text-xs ${
                        selected.status === st
                          ? "bg-red-600 text-white"
                          : "bg-white/5 text-zinc-400 hover:bg-white/10"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <CopyBlock
                  title="YouTube Title"
                  text={selected.title}
                  copied={copied === "title"}
                  onCopy={() => copyText("title", selected.title)}
                />
                <CopyBlock
                  title="Description"
                  text={selected.description || ""}
                  copied={copied === "desc"}
                  onCopy={() => copyText("desc", selected.description || "")}
                />
                <CopyBlock
                  title="Hashtags"
                  text={selected.hashtags || ""}
                  copied={copied === "hash"}
                  onCopy={() => copyText("hash", selected.hashtags || "")}
                />
                <CopyBlock
                  title="Tags"
                  text={selected.tags || ""}
                  copied={copied === "tags"}
                  onCopy={() => copyText("tags", selected.tags || "")}
                />
                <CopyBlock
                  title="Thumbnail g'oya"
                  text={selected.thumbnailIdea || ""}
                  copied={copied === "thumb"}
                  onCopy={() => copyText("thumb", selected.thumbnailIdea || "")}
                />

                <div>
                  <h3 className="mb-3 font-semibold">Montaj sahnalari</h3>
                  <div className="space-y-3">
                    {scenes.map((s) => (
                      <div key={s.order} className="rounded-2xl bg-white/5 p-4 text-sm">
                        <div className="mb-1 flex justify-between">
                          <span className="font-medium">
                            {s.order}. {s.title}
                          </span>
                          <span className="text-zinc-500">{s.durationSec}s</span>
                        </div>
                        <p className="text-zinc-300">{s.narration}</p>
                        <p className="mt-2 text-xs text-zinc-500">{s.visual}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CopyBlock({
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
          {copied ? "OK" : "Nusxa"}
        </button>
      </div>
      <pre className="whitespace-pre-wrap rounded-2xl bg-black/40 p-4 text-sm">{text}</pre>
    </div>
  );
}
