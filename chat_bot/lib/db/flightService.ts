import mongoose from "mongoose";
import connectDB from "../mongo";

// --- Flight Schema ---
const FlightSchema = new mongoose.Schema({
  flight_no: { type: String, required: true },
  airline_name: { type: String, required: true },
  source: { type: String, required: true },
  destination: { type: String, required: true },
});

// Avoid recompilation error
const Flight = mongoose.models.Flight || mongoose.model("Flight", FlightSchema);

// --- Service Functions ---
export async function createFlight(data: any) {
  await connectDB();
  const flight = await Flight.create(data);
  return flight;
}

export async function getFlights() {
  await connectDB();
  return await Flight.find();
}
