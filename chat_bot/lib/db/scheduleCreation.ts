import mongoose from "mongoose";
import connectDB from "../mongo";


const ScheduleSchema = new mongoose.Schema({
  flight_id: { type: mongoose.Schema.Types.ObjectId, ref: "Flight", required: true },
  scheduled_departure: { type: Date, required: true },
  scheduled_arrival: { type: Date, required: true },
  current_departure: Date,
  current_arrival: Date,
  current_status: {
    type: String,
    enum: ["On-Time", "Delayed", "Cancelled", "Landed"],
    default: "On-Time",
  },
});

const Schedule =
  mongoose.models.Schedule || mongoose.model("Schedule", ScheduleSchema);

export async function createSchedule(data: any) {
  await connectDB();
  const schedule = await Schedule.create(data);
  return schedule;
}

export async function getSchedules() {
  await connectDB();
  return await Schedule.find().populate("flight_id");
}
