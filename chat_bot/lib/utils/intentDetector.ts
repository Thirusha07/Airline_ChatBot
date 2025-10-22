export function detectIntent(userMessage: string): string | null {
  const message = userMessage.toLowerCase();
  if (message.includes("cancel")) return "Cancel Trip";
  if (message.includes("status")) return "Flight Status";
  if (message.includes("seat")) return "Seat Availability";
  if (message.includes("book")) return "Book Ticket Form"; // triggers booking form
  if (message.includes("my bookings")) return "Get Bookings";
  return null;
}
