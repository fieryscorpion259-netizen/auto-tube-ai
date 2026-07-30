import { google } from "googleapis";
// @ts-ignore
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import fs from "fs/promises";
import path from "path";

// FFmpeg manzilini to'g'irlash (Kompyuterda o'rnatilmagan bo'lsa ham ishlayverishi uchun)
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}
if (ffprobeStatic && ffprobeStatic.path) {
  ffmpeg.setFfprobePath(ffprobeStatic.path);
}

// 1. Ssenariy va Promptlarni AI (Gemini) orqali yasash
export async function generateHorrorScript(apiKey: string, retries = 3): Promise<any> {
  const prompt = `
    Act as a professional YouTube storyteller in the Horror/Scary Story niche.
    Write a VERY LONG and detailed scary story in English. The final spoken audio MUST be at least 10 minutes long (around 1500 to 2000 words).
    Provide the response in pure JSON format:
    {
      "title": "SEO title for YouTube",
      "description": "SEO description with #hashtags",
      "thumbnailPrompt": "A highly descriptive prompt for the YouTube video thumbnail. Dark, creepy, high contrast, glowing eyes.",
      "scenes": [
        {
          "narration": "Short text to be spoken (MUST BE UNDER 200 CHARACTERS PER SCENE). Generate at least 25-35 scenes to make it long.",
          "imagePrompt": "A highly descriptive prompt to generate a 16:9 creepy image for this scene. Foggy, dark, realistic horror.",
          "isScary": false
        }
      ]
    }
  `;

  const models = ["gemini-2.0-flash", "gemini-flash-latest"];

  for (const model of models) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" }
            })
          }
        );

        if (res.status === 429) {
          console.warn(`[Gemini API - ${model}] Rate limit tushdi, 5 soniya kutilmoqda (${i + 1}/${retries})...`);
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }

        const data: any = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          console.error(`[Gemini API - ${model}] API xatosi:`, JSON.stringify(data, null, 2));
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }

        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1 || end === -1) {
          continue;
        }

        const cleanJson = text.substring(start, end + 1);
        const parsed = JSON.parse(cleanJson);
        if (parsed && parsed.thumbnailPrompt && Array.isArray(parsed.scenes)) {
          return parsed;
        }
      } catch (e: any) {
        console.warn(`[Gemini API - ${model}] Urinish xatosi: ${e.message}`);
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  console.warn("⚠️ AI limitlari sababli zaxira (Fallback) ssenariy ishlatilmoqda...");
  return {
    title: "The Unseen Creature in the Woods - Terrifying True Story",
    description: "A chilling horror story of an encounter deep inside an abandoned forest... #horror #scarystories #creepypasta",
    thumbnailPrompt: "A dark foggy creepy forest with red glowing eyes in the trees, terrifying horror atmosphere",
    scenes: [
      {
        narration: "It was past midnight when I heard a strange tapping sound outside my cabin window...",
        imagePrompt: "Dark scary cabin in the woods at night with moonlight fog",
        isScary: false
      },
      {
        narration: "I looked outside into the darkness, and saw two glowing red eyes staring back at me...",
        imagePrompt: "Terrifying shadow creature with glowing red eyes behind trees in foggy forest",
        isScary: true
      },
      {
        narration: "I backed away slowly as the front door handle began to slowly turn...",
        imagePrompt: "Old wooden cabin door handle turning slowly in dark room with eerie shadows",
        isScary: true
      },
      {
        narration: "A cold whisper echoed through the hallway: 'You shouldn't have stayed here alone.'",
        imagePrompt: "Dark haunted hallway in abandoned wooden house creepy shadows horror",
        isScary: true
      }
    ]
  };
}

// 2. Rasm yasash (Pollinations AI - 100% Tekin)
export async function generateImage(prompt: string, outputPath: string, isThumbnail = false, retries = 3): Promise<string> {
  // Asosiy video va Thumbnail uchun ham format 1920x1080 (16:9)
  const width = 1920;
  const height = 1080;

  const encodedPrompt = encodeURIComponent(prompt + ", ultra realistic, 8k, dark horror lighting, cinematic");
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true`;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Rasm yasashda HTTP xato: ${response.status}`);

      const buffer = await response.arrayBuffer();
      await fs.writeFile(outputPath, Buffer.from(buffer));
      return outputPath;
    } catch (e: any) {
      console.warn(`Rasm yuklash xatosi (urinish ${i + 1}/${retries}): ${e.message}`);
      if (i === retries - 1) throw new Error("Rasm butunlay yuklanmadi");
      await new Promise(r => setTimeout(r, 3000)); // 3 soniya kutib qayta urinish
    }
  }
  return outputPath;
}

// 3. Audio yasash (Google TTS - 100% Tekin, Limitsiz)
export async function generateAudio(text: string, outputPath: string, retries = 3): Promise<string> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en-gb&q=${encodeURIComponent(text)}`;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`TTS HTTP error: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      await fs.writeFile(outputPath, Buffer.from(buffer));
      return outputPath;
    } catch (e: any) {
      console.warn(`TTS xatosi (urinish ${i + 1}/${retries}): ${e.message}`);
      if (i === retries - 1) throw new Error("TTS butunlay xato berdi");
      await new Promise(r => setTimeout(r, 2000)); // 2 soniya kutib qayta urinish
    }
  }
  return outputPath;
}

// 4. Sahnalarni videoga aylantirish va birlashtirish (FFmpeg Multi-stage)
// 4. Sahnalarni videoga aylantirish va birlashtirish (FFmpeg Multi-stage)
const getDuration = (filePath: string): Promise<number> => new Promise((resolve, reject) => {
  ffmpeg.ffprobe(filePath, (err: any, metadata: { format: { duration: any; }; }) => {
    if (err) reject(err);
    else resolve(metadata.format.duration || 5);
  });
});

export async function createSceneVideo(imagePath: string, audioPath: string, outputPath: string, isScary = false): Promise<void> {
  const duration = await getDuration(audioPath);

  return new Promise((resolve, reject) => {
    const cmd = ffmpeg()
      .input(imagePath)
      .loop(duration) // loop exactly for the duration
      .input(audioPath);

    const visualFilters = isScary
      ? `zoompan=z='min(zoom+0.015,1.5)':d=25*${duration}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080,eq=contrast=1.5:brightness=-0.1,fade=t=in:st=0:d=0.5,fade=t=out:st=${duration - 0.5}:d=0.5`
      : `zoompan=z='min(zoom+0.0015,1.5)':d=25*${duration}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080,fade=t=in:st=0:d=1,fade=t=out:st=${duration - 1}:d=1`;

    const audioFilters = isScary
      ? `vibrato=f=6.5:d=0.5,aecho=0.8:0.88:60:0.4` // Demonic scary voice
      : `afade=t=in:st=0:d=0.5,afade=t=out:st=${duration - 0.5}:d=0.5`; // Normal fade

    cmd
      .complexFilter([
        { filter: 'format', options: 'yuv420p', inputs: '0:v', outputs: 'formatted' },
        { filter: 'filtergraph', options: visualFilters, inputs: 'formatted', outputs: 'v_out' },
        { filter: 'filtergraph', options: audioFilters, inputs: '1:a', outputs: 'a_out' }
      ], ['v_out', 'a_out'])
      .outputOptions([
        "-c:v libx264",
        "-c:a aac",
        "-b:a 192k",
        "-r 25",
        "-shortest",
      ])
      .save(outputPath)
      .on("end", () => resolve())
      .on("error", (err: any) => reject(err));
  });
}

export async function mergeScenes(sceneVideos: string[], finalOutputPath: string): Promise<void> {
  const concatListPath = path.join(process.cwd(), "tmp", "concat_list.txt");
  const concatOutputPath = path.join(process.cwd(), "tmp", "concat_output.mp4");

  // 1. Create concat list
  const listContent = sceneVideos.map(v => `file '${v}'`).join('\n');
  await fs.writeFile(concatListPath, listContent);

  // 2. Concat videos (Fast, no re-encoding)
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(concatListPath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions('-c copy')
      .save(concatOutputPath)
      .on("end", () => resolve())
      .on("error", (err: any) => reject(err));
  });

  // 3. Add background creepy drone music
  return new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(concatOutputPath)
      .input("sine=frequency=45:beep_factor=4:duration=99999") // Lavfi eerie drone
      .inputFormat("lavfi")
      .complexFilter([
        { filter: 'amix', options: { inputs: 2, duration: 'first', weights: '1 0.05' } }
      ])
      .outputOptions([
        "-c:v copy",
        "-c:a aac",
        "-b:a 192k"
      ])
      .save(finalOutputPath)
      .on("end", () => resolve())
      .on("error", (err: any) => reject(err));
  });
}
