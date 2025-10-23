import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IFlight extends Document {
    flight_no: string;
    airline_name: string;
    source: string;
    destination: string;
}

const FlightSchema = new Schema<IFlight>(
  {
   
      flight_no: {
      type: String,
      required: true,
      unique:true,
      trim: true,
    },
      airline_name: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
},
    {
    timestamps: true,
    collection: "t_flight", 
  }
);

// Export model
const Flight = models.Flight || model<IFlight>("Flight", FlightSchema);
export default Flight;
