import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const active = await prisma.transaction.findMany({
    where: { status: "OUT" },
    orderBy: { checkOutTime: "desc" },
  });

  return NextResponse.json(active);
}
