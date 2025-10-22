import mongoose, { ConnectOptions } from "mongoose";

const URI = "mongodb+srv://21pw39_db_user:shwrr4z9SeHlVG2Z@airlinebot.nrm4q4i.mongodb.net/?retryWrites=true&w=majority&appName=AirlineBot";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    console.log("Already connected to MongoDB");
    console.log("Connected DB name:", mongoose.connection.name);
    return;
  }

  try {
    console.log("Entered to db");

    await mongoose.connect(URI, {
      dbName: "AirlineBot",
    } as ConnectOptions); 

    console.log("Connected DB name:", mongoose.connection.name);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
};

export default connectDB;

