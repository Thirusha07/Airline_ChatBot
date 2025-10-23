import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IPassenger extends Document {
  passenger_seat_id: number;
  booking_id?: string;
  schedule_id: mongoose.Types.ObjectId; // ref to Schedule
  first_name?: string;
  last_name?: string;
  gender?: "Male" | "Female" | "Other";
  age?: number;
  passport_number?: string;
  nationality?: string;
  row_number: number;
  column_letter: string;
  is_booked: boolean;
  class: "Economy" | "Business" | "First";
  price: number;
}

const PassengerSchema = new Schema<IPassenger>(
  {
    passenger_seat_id: { type: Number, required: true, unique: true },
    booking_id: { type: String, required: false, ref: "Booking" },
    schedule_id: {
      type: Schema.Types.ObjectId,
      ref: "Schedule",
      required: true,
    },
    first_name: { type: String, required: false },
    last_name: { type: String, required: false },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: false,
    },
    age: { type: Number, required: false },
    passport_number: { type: String, required: false },
    nationality: { type: String, required: false },
    row_number: { type: Number, required: true },
    column_letter: { type: String, required: true, maxlength: 1 },
    is_booked: { type: Boolean, required: true, default: false },
    class: {
      type: String,
      enum: ["Economy", "Business", "First"],
      required: true,
    },
    price: { type: Number, required: true },
  },
  { timestamps: true, collection: "PassengerSeat" }
);

const PassengerSeat =
  models.Passenger || model<IPassenger>("Passenger", PassengerSchema);
export default PassengerSeat;
