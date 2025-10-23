import { NextRequest, NextResponse } from "next/server";
import { BookingRequest } from "./types";
import { createBookingInDB } from "@/lib/db/service";


export async function POST(req: NextRequest) {
  try {
    const body: BookingRequest = await req.json();

    if (!body.customer_id || !body.schedule_id || !body.passengers?.length) {
      return NextResponse.json({ error: "Invalid booking data" }, { status: 400 });
    }

    const booking = await createBookingInDB(body);

    return NextResponse.json(
      { message: "Booking created successfully", booking },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
