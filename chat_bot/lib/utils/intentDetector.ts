export function detectIntent(userMessage: string): string | null {
  const message = userMessage.toLowerCase();

  if (message.includes("cancel") && message.includes("policy"))
    return "Get Cancellation Policy";

  if (message.includes("cancel"))
    return "Cancel Trip";

  if (message.includes("status"))
    return "Flight Status";

  if (message.includes("seat"))
    return "Seat Availability";

  if (message.includes("book"))
    return "Book Ticket Form"; // triggers booking flow

  if (message.includes("my bookings") || message.includes("get bookings"))
    return "Get Bookings";

  return "Unknown";
}
