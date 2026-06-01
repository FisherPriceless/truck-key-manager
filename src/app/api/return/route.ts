import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { truckNumber } = body;

  if (!truckNumber?.trim()) {
    return NextResponse.json(
      { error: "Truck number is required." },
      { status: 400 }
    );
  }

  const activeCheckout = await prisma.transaction.findFirst({
    where: { truckNumber: truckNumber.trim(), status: "OUT" },
  });

  if (!activeCheckout) {
    return NextResponse.json(
      { error: "This truck is not currently checked out." },
      { status: 404 }
    );
  }

  const transaction = await prisma.transaction.update({
    where: { id: activeCheckout.id },
    data: {
      returnTime: new Date(),
      status: "RETURNED",
    },
  });

  return NextResponse.json(transaction);
}
