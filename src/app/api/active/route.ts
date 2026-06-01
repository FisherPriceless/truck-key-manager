import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const active = await prisma.transaction.findMany({
      where: { status: "OUT" },
      orderBy: { checkOutTime: "desc" },
    });

    return NextResponse.json(active);
  } catch (error) {
    console.error("Active keys error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
