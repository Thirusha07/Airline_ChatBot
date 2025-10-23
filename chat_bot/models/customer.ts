import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ICustomer extends Document {
  cust_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  passport_number: string;
  gender: "Male" | "Female" | "Other";
  nationality: string;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    cust_id: {
      type: Number,
      required: true,
      unique: true, 
    },
    first_name: {
      type: String,
      required: true,
      trim: true,
    },
    last_name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, 
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    passport_number: {
      type: String,
      required: true,
      unique: true, 
    },
    gender:{
        type: String,
        required: true,
    },
    nationality:{
        type: String,
        required: true,         
    }
  },
  {
    timestamps: true, 
    collection: "t_customer", 
  }
);

// Export the model (avoid recompiling issue in Next.js)
const Customer = models.Customer || model<ICustomer>("Customer", CustomerSchema);
export default Customer;
