import { NextRequest, NextResponse } from "next/server";
import { updateSchedule } from "@/lib/db/scheduleService";

export async function PUT(req: NextRequest) {
  try {
    const { schedule_id, current_departure, current_arrival } = await req.json();

    if (!schedule_id) {
      return NextResponse.json({ error: "schedule_id is required" }, { status: 400 });
    }

    const updated = await updateSchedule({
      schedule_id,
      current_departure,
      current_arrival,
    });

    return NextResponse.json(
      { message: "Schedule updated successfully", schedule: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
