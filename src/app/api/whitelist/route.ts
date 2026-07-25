import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = [
  "muhammadaliuktamov42@gmail.com",
  "fieryscorpion259@gmail.com"
];

// Asosiy admin ekanligini tekshirish
async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return false;
  }
  return session.user.email;
}

export async function GET() {
  const adminEmail = await checkAdmin();
  if (!adminEmail) return NextResponse.json({ error: "Ruxsat etilmagan!" }, { status: 403 });

  const list = await prisma.whitelist.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const adminEmail = await checkAdmin();
  if (!adminEmail) return NextResponse.json({ error: "Ruxsat etilmagan!" }, { status: 403 });

  try {
    const { email } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: "Noto'g'ri pochta manzili" }, { status: 400 });
    }

    const added = await prisma.whitelist.create({
      data: {
        email: email.toLowerCase().trim(),
        addedBy: adminEmail
      }
    });

    return NextResponse.json(added);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Bu pochta allaqachon qo'shilgan" }, { status: 400 });
    }
    return NextResponse.json({ error: "Ichki xatolik yuz berdi" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const adminEmail = await checkAdmin();
  if (!adminEmail) return NextResponse.json({ error: "Ruxsat etilmagan!" }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "ID topilmadi" }, { status: 400 });

    await prisma.whitelist.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "O'chirishda xatolik" }, { status: 500 });
  }
}
