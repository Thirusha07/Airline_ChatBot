import connectDB from "@/lib/mongo";
import Booking from "@/models/booking";
import Schedule from "@/models/schedule";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { booking_id } = await req.json();

    if (!booking_id) {
      return NextResponse.json({ error: "booking_id is required" }, { status: 400 });
    }

    await connectDB();

    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Fetch related schedule to check departure time
    const schedule = await Schedule.findById(booking.schedule_id);
    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    const departureTime = new Date(schedule.scheduled_departure);
    const now = new Date();
    const timeDiffHours = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Determine refund % based on time left
    let refundPercentage = 0;
    if (timeDiffHours >= 48) refundPercentage = 0.9; // 90% refund if > 48 hrs before departure
    else if (timeDiffHours >= 24) refundPercentage = 0.5; // 50% refund if 24–48 hrs
    else refundPercentage = 0.2; // 20% refund if < 24 hrs

    const refundAmount = Math.round(booking.amount * refundPercentage);

    // Update booking status
    booking.payment_status = "Refunded";
    await booking.save();

    return NextResponse.json(
      {
        message: "Booking cancelled successfully",
        booking_id: booking._id,
        refund_amount: refundAmount,
        refund_percentage: refundPercentage * 100,
        departure_in_hours: Math.round(timeDiffHours),
        payment_status: booking.payment_status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
