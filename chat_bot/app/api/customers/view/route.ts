import connectDB from "@/lib/mongo";
import Customer from "@/models/customer";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const cust_id = searchParams.get("cust_id");

    let customers;

    if (cust_id) {
      customers = await Customer.findOne({ cust_id: Number(cust_id) });
      if (!customers) {
        return NextResponse.json({ message: "Customer not found" }, { status: 404 });
      }
    } else {
      customers = await Customer.find();
    }

    return NextResponse.json(customers, { status: 200 });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
