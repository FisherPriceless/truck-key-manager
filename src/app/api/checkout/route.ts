import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { truckNumber, employeeNumber, employeeName, routeNumber } = body;

  if (!employeeNumber?.trim()) {
    return NextResponse.json(
      { error: "Employee number is required." },
      { status: 400 }
    );
  }

  if (!truckNumber?.trim()) {
    return NextResponse.json(
      { error: "Truck number is required." },
      { status: 400 }
    );
  }

  const activeCheckout = await prisma.transaction.findFirst({
    where: { truckNumber: truckNumber.trim(), status: "OUT" },
  });

  if (activeCheckout) {
    return NextResponse.json(
      { error: "This truck is already checked out! It must be returned first." },
      { status: 409 }
    );
  }

  const transaction = await prisma.transaction.create({
    data: {
      truckNumber: truckNumber.trim(),
      employeeNumber: employeeNumber.trim(),
      employeeName: employeeName?.trim() || "",
      routeNumber: routeNumber?.trim() || "",
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
