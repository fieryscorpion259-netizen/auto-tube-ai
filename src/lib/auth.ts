import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

const baseAdapter = PrismaAdapter(prisma);

export const authOptions: NextAuthOptions = {
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
      // Siz ruxsat bergan odamlarning elektron pochtalari ro'yxati (Whitelist)
      const allowedEmails = [
        "muhammadaliuktamov42@gmail.com", 
        "fieryscorpion259@gmail.com"
      ];
      
      if (user.email) {
        // 1. Asosiy egalar bo'lsa kiradi
        if (allowedEmails.includes(user.email)) return true;
        
        // 2. Saytdan (Admin Paneldan) qo'shilganlar bo'lsa tekshiramiz
        try {
          const inDatabase = await prisma.whitelist.findUnique({
            where: { email: user.email }
          });
          if (inDatabase) return true;
        } catch (e) {
          console.error("Whitelist tekshirishda xato:", e);
        }
      }
      
      console.warn(`[XAVFSIZLIK] Ruxsatsiz begona odam kirishga urindi: ${user.email}`);
      return false; // Kirishni taqiqlash (Qaytarib yuboradi)
    },
    async session({ session, user }) {
      if (session.user) {
        // @ts-ignore
        session.user.id = user.id;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};
