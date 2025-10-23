import { NextRequest, NextResponse } from "next/server";
import { createSchedule } from "@/lib/db/scheduleService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.flight_id || !body.scheduled_departure || !body.scheduled_arrival) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const schedule = await createSchedule(body);
    return NextResponse.json(
      { message: "Schedule created successfully", schedule },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
