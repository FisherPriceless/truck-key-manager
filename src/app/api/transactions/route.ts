import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = parseInt(searchParams.get("limit") || "200");

    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (from || to) {
      where.checkOutTime = {};
      if (from) (where.checkOutTime as Record<string, Date>).gte = new Date(from);
      if (to) (where.checkOutTime as Record<string, Date>).lte = new Date(to + "T23:59:59");
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { checkOutTime: "desc" },
      take: limit,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Transactions error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
