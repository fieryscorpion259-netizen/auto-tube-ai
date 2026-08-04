import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

// Vercel / Environment variables'dagi NEXTAUTH_URL manzilidan ortiqcha /api/auth va /callback yo'llarini tozalash
if (process.env.NEXTAUTH_URL) {
  let cleaned = process.env.NEXTAUTH_URL.trim();
  cleaned = cleaned.replace(/\/api\/auth.*$/i, "");
  cleaned = cleaned.replace(/\/callback.*$/i, "");
  cleaned = cleaned.replace(/\/$/, "");
  process.env.NEXTAUTH_URL = cleaned;
}

if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
  if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes("localhost")) {
    process.env.NEXTAUTH_URL = "https://auto-tube-ai-fny2.vercel.app";
  }
}

const baseAdapter = PrismaAdapter(prisma);

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "autotube-secret-key-2026-super-secure",
  useSecureCookies: process.env.NODE_ENV === "production",
  session: {
    strategy: "jwt",
  },
  adapter: {
    ...baseAdapter,
    // Google ba'zan Prisma modelida yo'q maydon yuboradi — filtrlash
    linkAccount: async (data: any) => {
      const {
        refresh_token_expires_in,
        ...account
      } = data as typeof data & { refresh_token_expires_in?: number };

      return baseAdapter.linkAccount!({
        ...account,
        ...(typeof refresh_token_expires_in === "number"
          ? { refresh_token_expires_in }
          : {}),
      } as any);
    },
  } as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope:
            "openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const allowedEmails = [
        "muhammadaliuktamov42@gmail.com", 
        "fieryscorpion259@gmail.com",
        "shohruhkubayev117@gmail.com",
        "tajribay5@gmail.com"
      ].map((e) => e.toLowerCase());
      
      const email = user.email?.toLowerCase();
      if (email) {
        // 1. Asosiy egalar bo'lsa kiradi
        if (allowedEmails.includes(email)) return true;
        
        // 2. Saytdan (Admin Paneldan) qo'shilganlar bo'lsa tekshiramiz
        try {
          const inDatabase = await prisma.whitelist.findFirst({
            where: { email: { equals: email, mode: "insensitive" } }
          });
          if (inDatabase) return true;
        } catch (e) {
          console.error("Whitelist tekshirishda xato:", e);
        }
      }
      
      console.warn(`[XAVFSIZLIK] Ruxsatsiz begona odam kirishga urindi: ${user.email}`);
      return false; // Kirishni taqiqlash (Qaytarib yuboradi)
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.sub) {
        // @ts-ignore
        session.user.id = (token.id || token.sub) as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return url;
      try {
        if (new URL(url).origin === new URL(baseUrl).origin) return url;
      } catch {}
      return "/dashboard";
    },
  },
};
