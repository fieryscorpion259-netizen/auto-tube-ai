export type Scene = {
  order: number;
  title: string;
  narration: string;
  visual: string;
  durationSec: number;
};

export type GeneratedPackage = {
  topic: string;
  hook: string;
  body: string;
  cta: string;
  scenes: Scene[];
  seoTitle: string;
  seoDescription: string;
  hashtags: string[];
  tags: string[];
  thumbnailIdea: string;
  trendScore: number;
};

const HOOKS = [
  "To'xta — bu video oxirigacha ko'rsangiz, {topic} haqida fikringiz o'zgaradi.",
  "Ko'pchilik {topic}ni noto'g'ri qiladi. Mana nima uchun.",
  "3 daqiqada {topic}: oddiy, aniq va amaliy.",
  "Bugun {topic} bo'yicha eng kuchli usulni ochaman.",
  "Raqobatchilaringiz buni biladi. Siz hali yo'q.",
];

function pick<T>(arr: T[], seed = 0): T {
  return arr[Math.abs(seed) % arr.length];
}

function slugTags(topic: string, niche: string) {
  const base = topic
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 6);
  return Array.from(
    new Set([
      ...base,
      niche,
      "youtube",
      "trend",
      "2026",
      `${niche} tips`,
      `${niche} tutorial`,
    ])
  ).slice(0, 15);
}

function buildHashtags(topic: string, niche: string) {
  const words = topic
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ""));
  return Array.from(
    new Set([
      `#${niche.replace(/\s+/g, "")}`,
      ...words.map((w) => `#${w}`),
      "#YouTubeGrowth",
      "#Trend",
      "#Viral",
      "#ContentCreator",
      "#Shorts",
    ])
  ).slice(0, 12);
}

function localGenerate(input: {
  topic: string;
  niche: string;
  channelTitle?: string;
  language?: string;
  competitorInsights?: string[];
  trendHints?: string[];
}): GeneratedPackage {
  const { topic, niche } = input;
  const lang = input.language || "uz";
  const seed = topic.length + niche.length;
  const hook = pick(HOOKS, seed).replaceAll("{topic}", topic);
  const insights = input.competitorInsights?.slice(0, 3) || [];
  const trends = input.trendHints?.slice(0, 3) || [];

  const scenes: Scene[] = [
    {
      order: 1,
      title: "Hook",
      narration: hook,
      visual: `Yaqin plan: katta matn «${topic}» + kuchli thumbnail uslubidagi fon`,
      durationSec: 8,
    },
    {
      order: 2,
      title: "Muammo",
      narration: `${topic}da eng katta xato — tizimsiz harakat. Ko'pchilik natija kutadi, lekin jarayonni o'lchamaydi.`,
      visual: "Oddiy diagramma: muammo → oqibat",
      durationSec: 25,
    },
    {
      order: 3,
      title: "Yechim 1",
      narration: `1-qadam: ${topic}ni 3 ta aniq metrikaga bo'ling va har kuni bitta harakat qiling.`,
      visual: "Checklist animatsiyasi",
      durationSec: 35,
    },
    {
      order: 4,
      title: "Yechim 2",
      narration: insights.length
        ? `Raqobatchilar hozir shunga e'tibor bermoqda: ${insights.join("; ")}. Siz esa farq yaratishingiz kerak.`
        : `2-qadam: ${niche} bo'yicha auditoriya savollariga javob beradigan format tanlang.`,
      visual: "Split-screen: raqobatchi vs sizning yondashuv",
      durationSec: 40,
    },
    {
      order: 5,
      title: "Yechim 3 + misol",
      narration: trends.length
        ? `Trend signal: ${trends.join(" · ")}. Shu yo'nalishda amaliy misol bilan tushuntiring.`
        : `3-qadam: bitta case study — oldin/keyin natija bilan.`,
      visual: "Case study kartochkasi / before-after",
      durationSec: 40,
    },
    {
      order: 6,
      title: "CTA",
      narration: `Agar ${topic}ni chuqurroq ochishni xohlasangiz — obuna bo'ling, like bosing va kommentda savolingizni yozing. Keyingi videoda javob beraman.`,
      visual: "Subscribe + like end screen",
      durationSec: 12,
    },
  ];

  const body = scenes.map((s) => `## ${s.title}\n${s.narration}`).join("\n\n");
  const cta = scenes[scenes.length - 1].narration;
  const seoTitle =
    lang === "uz"
      ? `${topic}: ${niche} bo'yicha 2026 da ishlaydigan usul`
      : `${topic}: The ${niche} Method That Works in 2026`;

  const seoDescription = [
    `${hook}`,
    "",
    `Bu videoda:`,
    `✅ ${topic} asosiy xatolari`,
    `✅ Amaliy 3 qadamli yechim`,
    `✅ ${niche} yo'nalishidagi trend yondashuv`,
    "",
    input.channelTitle ? `Kanal: ${input.channelTitle}` : "",
    "",
    buildHashtags(topic, niche).join(" "),
  ]
    .filter(Boolean)
    .join("\n");

  const trendScore = Math.min(
    98,
    55 + topic.length % 20 + (insights.length + trends.length) * 6
  );

  return {
    topic,
    hook,
    body,
    cta,
    scenes,
    seoTitle: seoTitle.slice(0, 95),
    seoDescription,
    hashtags: buildHashtags(topic, niche),
    tags: slugTags(topic, niche),
    thumbnailIdea: `Qizil/qora fon, katta oq matn: «${topic}», chapda shok ifoda yoki strelka, o'ngda natija raqami`,
    trendScore,
  };
}

function buildPrompt(input: {
  topic: string;
  niche: string;
  channelTitle?: string;
  language?: string;
  competitorInsights?: string[];
  trendHints?: string[];
}) {
  return `Sen professional YouTube kontent strategisan. Til: ${input.language || "uz"}.
Kanal: ${input.channelTitle || "noma'lum"}
Nisha: ${input.niche}
Mavzu: ${input.topic}
Raqobatchi signallari: ${(input.competitorInsights || []).join(" | ") || "yo'q"}
Trend signallari: ${(input.trendHints || []).join(" | ") || "yo'q"}

JSON qaytar (faqat JSON, boshqa matn yo'q):
{
  "topic": "...",
  "hook": "...",
  "body": "to'liq ssenariy markdown",
  "cta": "...",
  "scenes": [{"order":1,"title":"...","narration":"...","visual":"...","durationSec":10}],
  "seoTitle": "max 95 belgi",
  "seoDescription": "...",
  "hashtags": ["#..."],
  "tags": ["..."],
  "thumbnailIdea": "...",
  "trendScore": 0-100
}`;
}

function mergePackage(parsed: Partial<GeneratedPackage>, fallback: GeneratedPackage): GeneratedPackage {
  return {
    ...fallback,
    ...parsed,
    scenes: parsed.scenes?.length ? parsed.scenes : fallback.scenes,
    hashtags: parsed.hashtags?.length ? parsed.hashtags : fallback.hashtags,
    tags: parsed.tags?.length ? parsed.tags : fallback.tags,
  };
}

function extractJson(text: string): Partial<GeneratedPackage> {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return {};
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function generateWithGemini(
  input: Parameters<typeof generateContentPackage>[0],
  apiKey: string
): Promise<GeneratedPackage | null> {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(input) }] }],
        generationConfig: {
          temperature: 0.8,
          responseMimeType: "application/json",
        },
      }),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text) return null;
  return mergePackage(extractJson(text), localGenerate(input));
}

async function generateWithOpenAI(
  input: Parameters<typeof generateContentPackage>[0],
  apiKey: string
): Promise<GeneratedPackage | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "YouTube growth expert. Reply with valid JSON only." },
        { role: "user", content: buildPrompt(input) },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const parsed = extractJson(data.choices?.[0]?.message?.content || "{}");
  return mergePackage(parsed, localGenerate(input));
}

export async function generateContentPackage(input: {
  topic: string;
  niche: string;
  channelTitle?: string;
  language?: string;
  competitorInsights?: string[];
  trendHints?: string[];
}): Promise<GeneratedPackage> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  try {
    if (geminiKey) {
      const result = await generateWithGemini(input, geminiKey);
      if (result) return result;
    }
    if (openaiKey) {
      const result = await generateWithOpenAI(input, openaiKey);
      if (result) return result;
    }
  } catch {
    // fallback pastga
  }

  return localGenerate(input);
}

export function suggestTopics(niche: string, competitorTitles: string[], trendTitles: string[]) {
  const seeds = [
    `${niche}: 5 ta xato`,
    `${niche}da 7 kunda natija`,
    `Yangi boshlovchilar uchun ${niche}`,
    `${niche} vs eski usul`,
    `2026: ${niche} trendlari`,
  ];

  const fromCompetitors = competitorTitles.slice(0, 4).map((t) => {
    const short = t.split(/[:|\-–]/)[0].trim().slice(0, 60);
    return `${short} — chuqurroq tahlil`;
  });

  const fromTrends = trendTitles.slice(0, 4).map((t) => `Trend: ${t.slice(0, 70)}`);

  return Array.from(new Set([...fromTrends, ...fromCompetitors, ...seeds])).slice(0, 10);
}
