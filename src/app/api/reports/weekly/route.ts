import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endDateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const endDate = new Date(endDateStr + "T23:59:59");
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        checkOutTime: { gte: startDate, lte: endDate },
      },
    });

    const totalCheckouts = transactions.length;
    const totalReturns = transactions.filter((t) => t.returnTime).length;
    const stillOut = transactions.filter((t) => t.status === "OUT").length;
    const uniqueTrucks = new Set(transactions.map((t) => t.truckNumber)).size;
    const uniqueEmployees = new Set(transactions.map((t) => t.employeeNumber)).size;

    const truckCounts: Record<string, number> = {};
    transactions.forEach((t) => {
      truckCounts[t.truckNumber] = (truckCounts[t.truckNumber] || 0) + 1;
    });
    const mostUsedTrucks = Object.entries(truckCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([truck, count]) => ({ truck, count }));

    const dailyBreakdown: { date: string; checkouts: number; returns: number }[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStr = d.toISOString().split("T")[0];
      const dayTx = transactions.filter(
        (t) => new Date(t.checkOutTime).toISOString().split("T")[0] === dayStr
      );
      const dayReturns = transactions.filter(
        (t) => t.returnTime && new Date(t.returnTime).toISOString().split("T")[0] === dayStr
      );
      dailyBreakdown.push({
        date: dayStr,
        checkouts: dayTx.length,
        returns: dayReturns.length,
      });
    }

    const returnedTx = transactions.filter((t) => t.returnTime);
    let avgDurationMs = 0;
    if (returnedTx.length > 0) {
      const totalMs = returnedTx.reduce((sum, t) => {
        return sum + (new Date(t.returnTime!).getTime() - new Date(t.checkOutTime).getTime());
      }, 0);
      avgDurationMs = totalMs / returnedTx.length;
    }

    return NextResponse.json({
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDateStr,
      totalCheckouts,
      totalReturns,
      stillOut,
      uniqueTrucks,
      uniqueEmployees,
      mostUsedTrucks,
      dailyBreakdown,
      avgDurationMs,
    });
  } catch (error) {
    console.error("Weekly report error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
