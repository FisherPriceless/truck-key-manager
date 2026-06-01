import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "truck";
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    let where: Record<string, unknown> = {};

    switch (type) {
      case "truck":
        where = { truckNumber: { contains: query.trim(), mode: "insensitive" } };
        break;
      case "employee":
        where = { employeeNumber: { contains: query.trim(), mode: "insensitive" } };
        break;
      case "transaction":
        const id = parseInt(query.trim());
        if (isNaN(id)) return NextResponse.json([]);
        where = { id };
        break;
    }

    const results = await prisma.transaction.findMany({
      where,
      orderBy: { checkOutTime: "desc" },
      take: 50,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
