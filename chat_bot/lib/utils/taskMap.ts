export const taskMap: Record<string, string[]> = {
  "Cancel Trip": ["getFlights", "getSchedules"],
  "Flight Status": ["getFlights", "getSchedules"],
  "Seat Availability": ["getFlights"],
  "Book Ticket Form": ["promptBookingForm"],   // just return fields to UI
  "Get Bookings": ["getBookingsByCustomer"],
};
