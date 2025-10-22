import { NextResponse } from "next/server";
import { getFlights } from "@/lib/db/flightService";

export async function GET() {
  try {
    const flights = await getFlights();
    return NextResponse.json(flights, { status: 200 });
  } catch (error) {
    console.error("Error fetching flights:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
