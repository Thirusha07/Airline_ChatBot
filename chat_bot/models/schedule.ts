import mongoose, { Schema, Document, models, model } from "mongoose";

// TypeScript interface for Schedule document
export interface ISchedule extends Document {
  schedule_id: number;          // PK
  flight_id: number;            // FK → t_flight.flight_id
  scheduled_departure: Date;
  scheduled_arrival: Date;
  current_departure?: Date;
  current_arrival?: Date;
  current_status: "On-Time" | "Delayed" | "Cancelled" | "Landed";
}

// Define Schema
const ScheduleSchema = new Schema<ISchedule>(
  {
    schedule_id: {
      type: Number,
      required: true,
      unique: true, // Primary key
    },
    flight_id: {
      type: Number,
      required: true,
      ref: "Flight", // Foreign key → t_flight
    },
    scheduled_departure: {
      type: Date,
      required: true,
    },
    scheduled_arrival: {
      type: Date,
      required: true,
    },
    current_departure: {
      type: Date,
      required: false,
    },
    current_arrival: {
      type: Date,
      required: false,
    },
    current_status: {
      type: String,
      enum: ["On-Time", "Delayed", "Cancelled", "Landed"],
      default: "On-Time",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "t_schedule",
  }
);

// Export model
const Schedule = models.Schedule || model<ISchedule>("Schedule", ScheduleSchema);
export default Schedule;
