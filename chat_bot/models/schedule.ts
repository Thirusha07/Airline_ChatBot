import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ISchedule extends Document {
  schedule_id: number;
  flight_no: mongoose.Types.ObjectId; // Reference to Flight _id
  scheduled_departure: Date;
  scheduled_arrival: Date;
  current_departure?: Date;
  current_arrival?: Date;
  current_status: "On-Time" | "Delayed" | "Cancelled" | "Landed";
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    schedule_id: { type: Number, required: true, unique: true },
    flight_no: {
      type: Schema.Types.ObjectId,
      ref: "Flight", // Reference Flight collection
      required: true,
    },
    scheduled_departure: { type: Date, required: true },
    scheduled_arrival: { type: Date, required: true },
    current_departure: { type: Date },
    current_arrival: { type: Date },
    current_status: {
      type: String,
      enum: ["On-Time", "Delayed", "Cancelled", "Landed"],
      required: false,
    },
  },
  { timestamps: true, collection: "t_schedule" }
);

const Schedule = models.Schedule || model<ISchedule>("Schedule", ScheduleSchema);
export default Schedule;
