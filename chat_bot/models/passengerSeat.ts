import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IPassenger extends Document {
  passenger_seat_id: number;      
  booking_id: string;             
  schedule_id: number;            
  first_name: string;
  last_name: string;
  gender: "Male" | "Female" | "Other";
  age: number;
  passport_number?: string;
  nationality: string;
  row_number: number;
  column_letter: string;
  is_booked: boolean;
  class: "Economy" | "Business" | "First";
  price: number;
}


const PassengerSchema = new Schema<IPassenger>(
  {
    passenger_seat_id: {
      type: Number,
      required: true,
      unique: true, 
    },
    booking_id: {
      type: String,
      required: true,
      ref: "Booking", 
    },
    schedule_id: {
      type: Number,
      required: true,
      ref: "Schedule", 
    },
    first_name: {
      type: String,
      required: true,
      trim: true,
    },
    last_name: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    age: {
      type: Number,
      required: false,
      min: 0,
    },
    passport_number: {
      type: String,
      required: false,
      trim: true,
    },
    nationality: {
      type: String,
      required: true,
      trim: true,
    },
    row_number: {
      type: Number,
      required: true,
      min: 1,
    },
    column_letter: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 1,
    },
    is_booked: {
      type: Boolean,
      required: true,
      default: true,
    },
    class: {
      type: String,
      enum: ["Economy", "Business", "First"],
      required: true,
      default: "Economy",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: "t_passenger",
  }
);

// Export model
const PassengerSeat = models.Passenger || model<IPassenger>("Passenger", PassengerSchema);
export default PassengerSeat;