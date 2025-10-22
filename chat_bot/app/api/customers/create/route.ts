import connectDB from "@/lib/mongo";
import Customer from "@/models/customer";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      cust_id,
      first_name,
      last_name,
      email,
      phone,
      passport_number,
      gender,
      nationality,
    } = body;

    // Validate required fields
    if (!cust_id || !first_name || !last_name || !email || !phone || !passport_number || !gender || !nationality) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create customer
    const customer = await Customer.create({
      cust_id,
      first_name,
      last_name,
      email,
      phone,
      passport_number,
      gender,
      nationality,
    });

    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
