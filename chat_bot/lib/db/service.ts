
import { BookingRequest } from "@/app/api/bookings/create/types";
import mongoose from "mongoose";
import connectDB from "../mongo";


// --- SCHEMA DEFINITIONS ---

const PassengerSeatSchema = new mongoose.Schema({
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  schedule_id: { type: Number, required: true },
  first_name: String,
  last_name: String,
  gender: String,
  nationality: String,
  row_number: Number,
  column_letter: String,
  class: String,
  price: Number,
  is_booked: { type: Boolean, default: true },
});

const BookingSchema = new mongoose.Schema({
  customer_id: { type: Number, required: true },
  schedule_id: { type: Number, required: true },
  amount: Number,
  booking_date: { type: Date, default: Date.now },
  payment_status: { type: String, default: "Paid" },
  payment_method: String,
});

// Prevent recompilation errors in Next.js hot reload
const Booking = mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
const PassengerSeat =
  mongoose.models.PassengerSeat || mongoose.model("PassengerSeat", PassengerSeatSchema);

// --- SERVICE FUNCTION ---

export async function createBookingInDB(data: BookingRequest) {
  await connectDB();

  const { customer_id, schedule_id, amount, payment_method, passengers } = data;

  // 1️⃣ Create Booking document
  const booking = await Booking.create({
    customer_id,
    schedule_id,
    amount,
    payment_method,
    payment_status: "Paid",
  });

  // 2️⃣ Create all passenger + seat entries linked to booking
  const passengerSeats = passengers.map((p) => ({
    booking_id: booking._id,
    schedule_id,
    first_name: p.first_name,
    last_name: p.last_name,
    gender: p.gender,
    nationality: p.nationality,
    row_number: p.row_number,
    column_letter: p.column_letter,
    class: p.class,
    price: p.price,
    is_booked: true,
  }));

  await PassengerSeat.insertMany(passengerSeats);

  return {
    booking_id: booking._id,
    passengers: passengerSeats,
  };
}
