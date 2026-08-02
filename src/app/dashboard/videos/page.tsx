"use client";

import { useEffect, useState, useRef } from "react";
import {
  Clapperboard,
  Copy,
  Check,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Download,
  Sparkles,
  Loader2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { safeJsonParse } from "@/lib/utils";

interface Scene {
  order: number;
  title?: string;
  narration: string;
  visual?: string;
  imagePrompt?: string;
  imageUrl?: string;
  audioUrl?: string;
  durationSec?: number;
  isScary?: boolean;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [preparingAssets, setPreparingAssets] = useState(false);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  // Video Studio State
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Load videos on mount
  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/videos");
      const json = await res.json();
      const list = json.videos || [];
      setVideos(list);
      if (list.length) {
        selectVideo(list[0]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function selectVideo(v: any) {
    setSelected(v);
    const parsedScenes = safeJsonParse<Scene[]>(v.scenesJson, []);
    // Ensure default imageUrl and audioUrl if not present, proxied for CORS safety
    const enriched = parsedScenes.map((s, idx) => {
      const rawImgUrl =
        s.imageUrl ||
        `https://image.pollinations.ai/prompt/${encodeURIComponent(
          (s.imagePrompt || s.visual || v.title) + ", dark scary horror lighting, cinematic, 8k, 16:9"
        )}?width=1280&height=720&nologo=true&seed=${idx * 791 + 45}`;

      const proxiedImgUrl = rawImgUrl.startsWith("http")
        ? `/api/image-proxy?url=${encodeURIComponent(rawImgUrl)}`
        : rawImgUrl;

      return {
        ...s,
        order: s.order || idx + 1,
        imageUrl: proxiedImgUrl,
        audioUrl: s.audioUrl || `/api/tts?text=${encodeURIComponent(s.narration || v.title)}`,
        durationSec: s.durationSec || 5,
      };
    });
    setScenes(enriched);
    setCurrentSceneIndex(0);
    setIsPlaying(false);
  }

  // Generate / Render Assets API Call
  async function prepareAssets() {
    if (!selected) return;
    setPreparingAssets(true);
    setError("");
    try {
      const res = await fetch("/api/videos/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: selected.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Aktivlarni tayyorlashda xatolik");

      if (json.video) {
        setSelected(json.video);
        selectVideo(json.video);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPreparingAssets(false);
    }
  }

  async function generateVideo() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/videos/generate", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Video tayyorlashda xatolik");
      await load();
      if (json.video) selectVideo(json.video);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  // Audio Playback & Scene Sync (with Web Speech API fallback)
  useEffect(() => {
    if (!isPlaying || !scenes.length) return;

    const currentScene = scenes[currentSceneIndex];
    if (!currentScene) return;

    let isCancelled = false;

    const handleNext = () => {
      if (isCancelled) return;
      if (currentSceneIndex < scenes.length - 1) {
        setCurrentSceneIndex((prev) => prev + 1);
      } else {
        setIsPlaying(false);
        setCurrentSceneIndex(0);
      }
    };

    // Web Speech API Fallback
    const playWebSpeech = () => {
      if (!("speechSynthesis" in window)) {
        setTimeout(handleNext, (currentScene.durationSec || 5) * 1000);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentScene.narration || "");
      utterance.rate = 0.95;
      utterance.onend = handleNext;
      utterance.onerror = handleNext;
      window.speechSynthesis.speak(utterance);
    };

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.src = currentScene.audioUrl || `/api/tts?text=${encodeURIComponent(currentScene.narration)}`;
    audio.muted = isMuted;

    const handleEnded = () => handleNext();

    audio.addEventListener("ended", handleEnded);
    audio
      .play()
      .catch((err) => {
        console.warn("Audio tag play failed, switching to Web Speech API:", err);
        playWebSpeech();
      });

    return () => {
      isCancelled = true;
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying, currentSceneIndex, scenes, isMuted]);

  // Canvas Canvas Rendering (Ken Burns Effect & Subtitles)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !scenes.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const activeScene = scenes[currentSceneIndex];
    if (!activeScene) return;

    let startTime = performance.now();
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = activeScene.imageUrl || "";

    let isCancelled = false;

    const render = (time: number) => {
      if (isCancelled) return;

      const elapsed = (time - startTime) / 1000;
      const progress = Math.min(elapsed / (activeScene.durationSec || 5), 1);

      // Clear Canvas
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (img.complete && img.naturalWidth !== 0) {
        // Subtle Zoom/Pan animation (Ken Burns)
        const scale = 1 + progress * 0.08;
        const xOffset = (progress * 15) % 30;
        const yOffset = (progress * 10) % 20;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-canvas.width / 2 + xOffset, -canvas.height / 2 + yOffset);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        // Loading placeholder on canvas
        ctx.fillStyle = "#18181b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#a1a1aa";
        ctx.font = "20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Kadr ${currentSceneIndex + 1} rasmi yuklanmoqda...`, canvas.width / 2, canvas.height / 2);
      }

      // Dark Overlay Vignette
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.3,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.7
      );
      gradient.addColorStop(0, "rgba(0,0,0,0.1)");
      gradient.addColorStop(1, "rgba(0,0,0,0.75)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtitles Bar at bottom
      const subtitleText = activeScene.narration || "";
      if (subtitleText) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(40, canvas.height - 110, canvas.width - 80, 80);

        ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
        ctx.lineWidth = 2;
        ctx.strokeRect(40, canvas.height - 110, canvas.width - 80, 80);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 22px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Wrap text if needed
        const words = subtitleText.split(" ");
        let line = "";
        let lines: string[] = [];

        for (let n = 0; n < words.length; n++) {
          let testLine = line + words[n] + " ";
          let metrics = ctx.measureText(testLine);
          if (metrics.width > canvas.width - 120 && n > 0) {
            lines.push(line);
            line = words[n] + " ";
          } else {
            line = testLine;
          }
        }
        lines.push(line);

        lines.slice(0, 2).forEach((l, i) => {
          ctx.fillText(
            l.trim(),
            canvas.width / 2,
            canvas.height - 90 + i * 30
          );
        });
      }

      // Watermark / Brand Tag
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "14px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("AutoTube AI", canvas.width - 20, 30);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isCancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentSceneIndex, scenes]);

  // Video Exporter (Download Video as .webm)
  async function exportVideo() {
    const canvas = canvasRef.current;
    if (!canvas || !scenes.length) return;

    setIsExporting(true);
    setExportProgress(0);
    setIsPlaying(false);

    try {
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selected?.title || "youtube-video"}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setExportProgress(100);
      };

      mediaRecorder.start();

      // Play through all scenes step by step for recording
      for (let i = 0; i < scenes.length; i++) {
        setCurrentSceneIndex(i);
        setExportProgress(Math.round(((i + 1) / scenes.length) * 100));

        // Play audio during recording
        const scene = scenes[i];
        const audio = new Audio(scene.audioUrl);
        await new Promise((resolve) => {
          audio.onended = resolve;
          audio.onerror = () => setTimeout(resolve, 4000);
          audio.play().catch(() => setTimeout(resolve, 4000));
        });
      }

      mediaRecorder.stop();
    } catch (err: any) {
      console.error("Export error:", err);
      setError("Videoni skachat qilishda xatolik: " + err.message);
      setIsExporting(false);
    }
  }

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auto-Video Studio</h1>
          <p className="mt-1 text-zinc-400">
            AI tomonidan ssenariy, rasmlar va diktor ovozi bilan tayyorlangan avtomatik videolar
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={generateVideo}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50 shadow-lg shadow-red-600/20"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-amber-200" />
            )}
            {generating ? "AI Video Yaratilmoqda..." : "⚡ Yangi AI Video Yaratish"}
          </button>
          {selected && (
            <>
              <button
                onClick={prepareAssets}
                disabled={preparingAssets}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/20 disabled:opacity-50"
              >
                {preparingAssets ? (
                  <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                ) : (
                  <Clapperboard className="h-4 w-4 text-red-400" />
                )}
                Kadrlar & Ovoz Yangilash
              </button>
              <button
                onClick={exportVideo}
                disabled={isExporting}
                className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isExporting ? `Export (${exportProgress}%)` : "Videoni Skachat Qilish"}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </div>
      ) : !videos.length ? (
        <div className="glass-card rounded-3xl p-10 text-center">
          <Clapperboard className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <p className="text-lg font-semibold text-zinc-300">Hali video paketi yo'q</p>
          <p className="mt-2 text-sm text-zinc-500">
            Avval «Ssenariylar» bo'limida kontent yarating, so'ng «Videoga aylantirish» tugmasini bosing.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-5">
          {/* Left Sidebar Video List */}
          <div className="space-y-3 xl:col-span-2">
            <h2 className="text-sm font-medium text-zinc-400">Videolar ro'yxati ({videos.length})</h2>
            <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
              {videos.map((v) => (
                <button
                  key={v.id}
                  onClick={() => selectVideo(v)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected?.id === v.id
                      ? "border-red-500/50 bg-red-500/10 shadow-lg shadow-red-500/5"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}
                >
                  <p className="line-clamp-2 text-sm font-semibold text-zinc-100">{v.title}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-zinc-400">
                      {v.status}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Main Studio View */}
          <div className="space-y-6 xl:col-span-3">
            {selected && (
              <>
                {/* Interactive Canvas Video Studio Player */}
                <div className="glass-card overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-2xl">
                  <div className="relative aspect-video w-full bg-black">
                    <canvas
                      ref={canvasRef}
                      width={1280}
                      height={720}
                      className="h-full w-full object-contain"
                    />

                    {/* Controls Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white transition hover:scale-105 hover:bg-red-500"
                        >
                          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                        </button>
                        <button
                          onClick={() =>
                            setCurrentSceneIndex((prev) => Math.max(0, prev - 1))
                          }
                          disabled={currentSceneIndex === 0}
                          className="rounded-full p-2 text-zinc-300 hover:bg-white/10 disabled:opacity-30"
                        >
                          <SkipBack className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() =>
                            setCurrentSceneIndex((prev) =>
                              Math.min(scenes.length - 1, prev + 1)
                            )
                          }
                          disabled={currentSceneIndex >= scenes.length - 1}
                          className="rounded-full p-2 text-zinc-300 hover:bg-white/10 disabled:opacity-30"
                        >
                          <SkipForward className="h-5 w-5" />
                        </button>
                        <span className="text-xs font-medium text-zinc-300">
                          Kadr {currentSceneIndex + 1} / {scenes.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="rounded-full p-2 text-zinc-300 hover:bg-white/10"
                        >
                          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Badges & Quick Tools */}
                <div className="glass-card rounded-3xl p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-white">{selected.title}</h2>
                    <div className="flex flex-wrap gap-2">
                      {["ready", "editing", "uploaded", "scheduled"].map((st) => (
                        <button
                          key={st}
                          onClick={() => setStatus(selected.id, st)}
                          className={`rounded-full px-3 py-1 text-xs transition ${
                            selected.status === st
                              ? "bg-red-600 font-semibold text-white"
                              : "bg-white/5 text-zinc-400 hover:bg-white/10"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scenes Navigation Grid */}
                  <div className="mt-6 space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-300">
                      Video Sahnalari va Kadrlar ({scenes.length} ta)
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {scenes.map((s, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setCurrentSceneIndex(idx);
                            setIsPlaying(true);
                          }}
                          className={`cursor-pointer overflow-hidden rounded-2xl border p-3 transition ${
                            currentSceneIndex === idx
                              ? "border-red-500 bg-red-500/10"
                              : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {s.imageUrl && (
                              <img
                                src={s.imageUrl}
                                alt={`Kadr ${s.order}`}
                                className="h-14 w-24 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1 overflow-hidden">
                              <p className="text-xs font-semibold text-red-400">
                                Kadr #{s.order}
                              </p>
                              <p className="line-clamp-2 text-xs text-zinc-300">
                                {s.narration}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SEO Metadata Copy Blocks */}
                  <div className="mt-8 space-y-4">
                    <h3 className="text-base font-semibold text-white">YouTube SEO Ma'lumotlari</h3>
                    <CopyBlock
                      title="YouTube Sarlavha (Title)"
                      text={selected.title}
                      copied={copied === "title"}
                      onCopy={() => copyText("title", selected.title)}
                    />
                    <CopyBlock
                      title="YouTube Tavsif (Description)"
                      text={selected.description || ""}
                      copied={copied === "desc"}
                      onCopy={() => copyText("desc", selected.description || "")}
                    />
                    <CopyBlock
                      title="Hashtaglar"
                      text={selected.hashtags || ""}
                      copied={copied === "hash"}
                      onCopy={() => copyText("hash", selected.hashtags || "")}
                    />
                    <CopyBlock
                      title="Teglar (Tags)"
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
                  </div>
                </div>
              </>
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
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-zinc-400">{title}</h4>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1 text-xs text-zinc-400 transition hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Nusxalandi!" : "Nusxa olish"}
        </button>
      </div>
      <pre className="whitespace-pre-wrap rounded-2xl border border-white/5 bg-black/40 p-3.5 text-xs text-zinc-300">
        {text}
      </pre>
    </div>
  );
}
