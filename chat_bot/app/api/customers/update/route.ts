import connectDB from "@/lib/mongo";
import Customer from "@/models/customer";
import { NextResponse } from "next/server";


export async function PATCH(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { cust_id, ...updates } = body;

    if (!cust_id) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    // Find customer
    const customer = await Customer.findOne({ cust_id });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Update fields
    Object.keys(updates).forEach((key) => {
      (customer as any)[key] = (updates as any)[key];
    });

    await customer.save();

    return NextResponse.json({ success: true, customer }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
