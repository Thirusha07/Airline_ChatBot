import { createBookingInDB } from "../db/service";
import connectDB from "../../lib/mongo";
import mongoose from "mongoose";

const Booking = mongoose.models.Booking;

export const taskFunctionMap: Record<string, Function> = {
  createBookingInDB,
  promptBookingForm: async () => {
    // return fields for UI form
    return {
      message: "Please fill in the booking details",
      fields: {
        customer_id: "number",
        schedule_id: "number",
        amount: "number",
        payment_method: "string (card/upi/wallet)",
        passengers: [
          {
            first_name: "string",
            last_name: "string",
            gender: "string",
            nationality: "string",
            row_number: "number",
            column_letter: "string",
            class: "string",
            price: "number",
          },
        ],
      },
    };
  },
  getBookingsByCustomer: async (customerId: number) => {
    await connectDB();
    const bookings = await Booking.find({ customer_id: customerId }).lean();
    return bookings;
  },
};

export async function executeTask(taskName: string, input?: any) {
  const fn = taskFunctionMap[taskName];
  if (!fn) throw new Error(`Function not found for ${taskName}`);
  return await fn(input);
}
