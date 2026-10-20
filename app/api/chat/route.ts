import { google } from "@ai-sdk/google"
import { auth } from "@clerk/nextjs/server"
import { convertToModelMessages, streamText, type UIMessage } from "ai"

// Streaming responses can run longer than the default serverless budget.
export const maxDuration = 30

export async function POST(req: Request) {
  // The chat route is a public endpoint; never stream for a signed-out caller.
  await auth.protect()

  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    // Requires GOOGLE_GENERATIVE_AI_API_KEY.
    model: google("gemini-3.8-flash"),
    instructions: "You are a helpful assistant.",
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
