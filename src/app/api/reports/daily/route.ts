import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const startOfDay = new Date(dateStr + "T00:00:00");
    const endOfDay = new Date(dateStr + "T23:59:59");

    const transactions = await prisma.transaction.findMany({
      where: {
        checkOutTime: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { checkOutTime: "asc" },
    });

    const totalCheckouts = transactions.length;
    const totalReturns = transactions.filter((t) => t.returnTime).length;
    const stillOut = transactions.filter((t) => t.status === "OUT").length;
    const uniqueTrucks = new Set(transactions.map((t) => t.truckNumber)).size;
    const uniqueEmployees = new Set(transactions.map((t) => t.employeeNumber)).size;

    const hourlyActivity: { hour: number; checkouts: number; returns: number }[] = [];
    for (let h = 0; h < 24; h++) {
      const checkouts = transactions.filter(
        (t) => new Date(t.checkOutTime).getHours() === h
      ).length;
      const returns = transactions.filter(
        (t) => t.returnTime && new Date(t.returnTime).getHours() === h
      ).length;
      if (checkouts > 0 || returns > 0) {
        hourlyActivity.push({ hour: h, checkouts, returns });
      }
    }

    return NextResponse.json({
      date: dateStr,
      totalCheckouts,
      totalReturns,
      stillOut,
      totalTransactions: totalCheckouts,
      uniqueTrucks,
      uniqueEmployees,
      hourlyActivity,
      transactions: transactions.map((t) => ({
        id: t.id,
        truckNumber: t.truckNumber,
        employeeNumber: t.employeeNumber,
        routeNumber: t.routeNumber,
        checkOutTime: t.checkOutTime,
        returnTime: t.returnTime,
        status: t.status,
      })),
    });
  } catch (error) {
    console.error("Daily report error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
