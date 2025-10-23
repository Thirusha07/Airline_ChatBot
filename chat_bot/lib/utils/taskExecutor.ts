import mongoose from "mongoose";
import connectDB from "../../lib/mongo";
import { createBookingInDB } from "../db/service";
import PassengerSeat from "@/models/passengerSeat";


const Booking = mongoose.models.Booking;
const Seat = mongoose.models.PassengerSeat;


const taskFunctionMap: Record<string, Function> = {
  createBookingInDB,

  // Get all bookings for a customer
  getBookingsByCustomer: async (customerId: number) => {
    await connectDB();
    const bookings = await Booking.find({ customer_id: customerId }).lean();
    return bookings.length
      ? bookings
      : { message: `No bookings found for customer ID ${customerId}.` };
  },

  // Cancel booking by flight_no and customer_id
//   cancelBooking: async (input: { flightNo: string; customerId: number }) => {
//   const { flightNo, customerId } = input;
//   await connectDB();

//   const schedule = await mongoose.models.Schedule.findOne({ flight_no: flightNo });
//   if (!schedule) return { message: `No flight found with number ${flightNo}` };

//   const booking = await Booking.findOne({ schedule_id: schedule._id, customer_id: customerId });
//   if (!booking) return { message: `No booking found for flight ${flightNo}` };

//   await Booking.findByIdAndDelete(booking._id);
//   return { message: `Booking for flight ${flightNo} has been cancelled.` };
// },


  // Seat availability by flight_no
  getSeatAvailability: async (flightNo: string) => {
    await connectDB();

    const Flight = mongoose.models.Flight;
    const flight = await Flight.findOne({ flight_no: flightNo });
    if (!flight) return { message: `No flight found with number ${flightNo}` };

    const seats = await PassengerSeat.find({
      flight_id: flight._id,
      is_booked: false,
    }).lean();

    return seats.length
      ? seats
      : { message: `No available seats for flight ${flightNo}.` };
  },

  // Flight status by flight_no
  getFlightStatus: async (flightNo: string) => {
    await connectDB();

    const Flight = mongoose.models.Flight;
    const flight = await Flight.findOne({ flight_no: flightNo });
    if (!flight) return { message: `No flight found with number ${flightNo}` };

    // Find the schedule using flight._id
    const schedule = await mongoose.models.Schedule.findOne({ flight_no: flight._id });
    return schedule
      ? {
          flight_no: flight.flight_no,
          current_status: schedule.current_status,
          scheduled_departure: schedule.scheduled_departure,
          scheduled_arrival: schedule.scheduled_arrival,
        }
      : { message: `No schedule found for flight ${flightNo}` };
  },

  // Cancellation policy
  getCancellationPolicy: async () => ({
    message:
      "Cancellations made 24 hours before departure are fully refundable. Within 24 hours, a 50% cancellation fee applies.",
  }),

  // Unknown input
  unknown: async () => ({
    message: "Sorry, I didn’t understand that request. Could you please rephrase or provide more details?",
  }),
};

export async function executeTask(taskName: string, input?: any) {
  const fn = taskFunctionMap[taskName];
  if (!fn) throw new Error(`No function found for task: ${taskName}`);
  return await fn(input);
}
