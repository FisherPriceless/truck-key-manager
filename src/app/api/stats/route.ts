import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [activeCount, totalTrucks, totalTransactions] = await Promise.all([
      prisma.transaction.count({ where: { status: "OUT" } }),
      prisma.transaction.groupBy({
        by: ["truckNumber"],
        _count: true,
      }),
      prisma.transaction.count(),
    ]);

    const freeTrucks = totalTrucks.length - activeCount;

    return NextResponse.json({
      activeKeys: activeCount,
      freeTrucks: Math.max(0, freeTrucks),
      totalTrucks: totalTrucks.length,
      totalTransactions,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
