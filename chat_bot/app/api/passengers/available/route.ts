import connectDB from "@/lib/mongo";
import PassengerSeat from "@/models/passengerSeat";
import { NextResponse } from "next/server";


// GET /api/passengers/available?schedule_id=123
export async function GET(req: Request) {
  try {
    await connectDB();

    // Get schedule_id from query parameters
    const { searchParams } = new URL(req.url);
    const schedule_id = searchParams.get("schedule_id");

    if (!schedule_id) {
      return NextResponse.json(
        { error: "schedule_id query parameter is required" },
        { status: 400 }
      );
    }

    // Find seats that are not booked for the schedule
    const availableSeats = await PassengerSeat.find({
      schedule_id: Number(schedule_id),
      is_booked: false,
    }).select("row_number column_letter class price"); // only return relevant seat info

    return NextResponse.json({ availableSeats }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching available seats:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
