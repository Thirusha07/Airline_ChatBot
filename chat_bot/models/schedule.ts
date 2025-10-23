import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ISchedule extends Document {
  flight_id: mongoose.Types.ObjectId; // Reference to Flight _id
  scheduled_departure: Date;
  scheduled_arrival: Date;
  current_departure?: Date;
  current_arrival?: Date;
  current_status: "On-Time" | "Delayed" | "Cancelled" | "Landed";
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    flight_id: {
      type: Schema.Types.ObjectId,
      ref: "Flight",
      required: true,
    },
    scheduled_departure: { type: Date, required: true },
    scheduled_arrival: { type: Date, required: true },
    current_departure: { type: Date },
    current_arrival: { type: Date },
    current_status: {
      type: String,
      enum: ["On-Time", "Delayed", "Cancelled", "Landed"],
      default: "On-Time",
    },
  },
  { timestamps: true, collection: "Schedule" }
);

const Schedule = models.Schedule || model<ISchedule>("Schedule", ScheduleSchema);
export default Schedule;
