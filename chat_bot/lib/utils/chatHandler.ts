import { executeTask } from "../utils/taskExecutor";

export async function handleUserMessage(message: string) {
  message = message.toLowerCase().trim();

  // Extract flight number (like AI202) or numeric customer ID
  const flightMatch = message.match(/[a-zA-Z]{2}\d+/); 
  const numberMatch = message.match(/\d+/); 
  const flightNo = flightMatch ? flightMatch[0].toUpperCase() : null;
  const customerId = numberMatch ? Number(numberMatch[0]) : null;

  // GET BOOKINGS FOR CUSTOMER
  if (message.includes("book") || message.includes("my bookings") || message.includes("show bookings")) {
    if (!customerId) {
      return { message: "Please provide your customer ID to view your bookings." };
    }
    return await executeTask("getBookingsByCustomer", customerId);
  }

  // CANCEL BOOKING
//   if (message.includes("cancel")) {
//     if (!flightNo || !customerId) {
//       return { message: "Please provide flight number and your customer ID to cancel a booking." };
//     }
//     return await executeTask("cancelBooking", { flightNo, customerId });

//   }

  // FLIGHT STATUS
  if (message.includes("status")) {
    if (!flightNo) {
      return { message: "Please provide the flight number to check status." };
    }
    return await executeTask("getFlightStatus", flightNo);
  }

  // SEAT AVAILABILITY
  if (message.includes("seat")) {
    if (!flightNo) {
      return { message: "Please provide the flight number to check seat availability." };
    }
    return await executeTask("getSeatAvailability", flightNo);
  }

  // CANCELLATION POLICY
  if (message.includes("policy")) {
    return await executeTask("getCancellationPolicy");
  }

  // UNKNOWN INPUT
  return await executeTask("unknown");
}
