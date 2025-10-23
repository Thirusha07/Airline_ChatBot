import { NextRequest, NextResponse } from "next/server";
import { createFlight } from "@/lib/db/flightService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.flight_no || !body.airline_name || !body.source || !body.destination) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const flight = await createFlight(body);

    return NextResponse.json(
      { message: "Flight created successfully", flight },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating flight:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
