import { detectIntent } from "./intentDetector";
import { taskMap } from "./taskMap";
import { executeTask } from "./taskExecutor";

export async function handleUserMessage(userMessage: string) {
  const intent = detectIntent(userMessage);

  if (!intent) {
    // Always return JSON, even for unrecognized input
    return {
      intent: "Unknown",
      responses: [
        {
          task: "none",
          result: { message: "Sorry, I didn't understand that." },
        },
      ],
    };
  }

  const tasks = taskMap[intent];
  let responses: any[] = [];

  for (const task of tasks) {
    const result = await executeTask(task, userMessage); // pass input if needed
    responses.push({ task, result });
  }

  return { intent, responses };
}
