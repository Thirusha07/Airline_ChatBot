
import PassengerSeat from "@/models/passengerSeat";
import mongoose from "mongoose";

export async function generateSeatsForSchedule(schedule_id: mongoose.Types.ObjectId) {
  const seats: any[] = [];

  const layout = [
    { rows: [1, 2], class: "First", price: 20000 },
    { rows: [3, 4, 5], class: "Business", price: 10000 },
    { rows: [6, 7, 8, 9, 10], class: "Economy", price: 5000 },
  ];

  const columns = ["A", "B", "C", "D", "E", "F"];
  let passenger_seat_id = 1;

  layout.forEach((section) => {
    section.rows.forEach((row) => {
      columns.forEach((col) => {
        seats.push({
          passenger_seat_id: passenger_seat_id++,
          schedule_id,
          row_number: row,
          column_letter: col,
          class: section.class,
          price: section.price,
          is_booked: false,
        });
      });
    });
  });

  await PassengerSeat.insertMany(seats);
  console.log(`Generated ${seats.length} seats for schedule ${schedule_id}`);
}
