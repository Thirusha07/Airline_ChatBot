import { handleUserMessage } from "../../../lib/utils/chatHandler";

export async function POST(req: Request) {
  try {
    const { message } = await req.json(); // e.g., "book flights"
    const response = await handleUserMessage(message);
    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in chat route:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}
