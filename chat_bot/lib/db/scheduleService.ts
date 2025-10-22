import mongoose from "mongoose";
import connectDB from "../mongo";
import Schedule, { ISchedule } from "@/models/schedule";

function getStatus(
  scheduled_departure: Date,
  scheduled_arrival: Date,
  current_departure?: Date,
  current_arrival?: Date
): "On-Time" | "Delayed" | "Landed" {
  if (current_arrival) return "Landed";
  if (!current_departure && !current_arrival) return "On-Time";

  const depDiff = current_departure
    ? new Date(current_departure).getTime() - new Date(scheduled_departure).getTime()
    : 0;

  const arrDiff = current_arrival
    ? new Date(current_arrival).getTime() - new Date(scheduled_arrival).getTime()
    : 0;

  const maxDiff = Math.max(depDiff, arrDiff);

  return maxDiff > 10 * 60 * 1000 ? "Delayed" : "On-Time";
}


// Update schedule function
export async function updateSchedule({
  schedule_id,
  current_departure,
  current_arrival,
}: {
  schedule_id: string;
  current_departure?: Date;
  current_arrival?: Date;
}) {
  // Connect to MongoDB
  await connectDB();

  // Find schedule by ID
  const schedule: ISchedule | null = await Schedule.findById(schedule_id);
  if (!schedule) throw new Error("Schedule not found");

  // Compute new status
  const status = getStatus(
    schedule.scheduled_departure,
    schedule.scheduled_arrival,
    current_departure ?? schedule.current_departure,
    current_arrival ?? schedule.current_arrival
  );

  // Update schedule fields
  schedule.current_departure = current_departure ?? schedule.current_departure;
  schedule.current_arrival = current_arrival ?? schedule.current_arrival;
  schedule.current_status = status;

  // Save to DB
  await schedule.save();

  // Return structured response
  return {
    schedule_id: schedule.schedule_id,
    flight_no: schedule.flight_no,
    scheduled_departure: schedule.scheduled_departure,
    scheduled_arrival: schedule.scheduled_arrival,
    current_departure: schedule.current_departure,
    current_arrival: schedule.current_arrival,
    current_status: schedule.current_status,
  };
}
