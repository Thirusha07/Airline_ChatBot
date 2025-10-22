import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IBooking extends Document {
  cust_id: number; 
  schedule_id: number;
  seat_id: number;   
  booking_date: Date;
  class: "Economy" | "Business" | "First";
  amount: number;
  payment_status: "Paid" | "Pending" | "Refunded";
  payment_method: "Card" | "UPI" | "NetBanking";
}

const BookingSchema = new Schema<IBooking>(
  {
    
    cust_id: {
      type: Number,
      required: true,
      ref: "Customer", 
    },
    schedule_id: {
      type: Number,
      required: true,
      ref: "Flight", 
    },
    seat_id: {
      type:Number,
      required: true,
      ref: "PassengerSeat", 
    },
    booking_date: {
      type: Date,
      required: true,
      default: Date.now, 
    },
    class: {
      type: String,
      required: true,
      trim: true,
      default: "Economy",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    payment_status: {
      type: String,
      required: true,
      default: "Pending",
    },
    payment_method: {
      type: String,
      required: true,
      default: "Card",
    },
  },
  {
    timestamps: true,
    collection: "t_booking", 
  }
);

// Export the model
const Booking = models.Booking || model<IBooking>("Booking", BookingSchema);
export default Booking;
