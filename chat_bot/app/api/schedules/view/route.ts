import { getSchedules } from "@/lib/db/scheduleCreation";
import { NextResponse } from "next/server";


export async function GET() {
  try {
    const schedules = await getSchedules();
    return NextResponse.json(schedules, { status: 200 });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
