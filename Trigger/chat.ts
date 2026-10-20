import { groq } from "@ai-sdk/groq"
import { chat } from "@trigger.dev/sdk/ai"

export const chatAgent = chat.agent({
  id: "chat",
  // `streamText` comes from the run payload so the managed options apply.
  run: async ({ messages, signal, streamText }) =>
    streamText({
      // Requires GROQ_API_KEY. Groq's current production model; Llama is
      // enterprise-only on Groq since 2026-08-16.
      model: groq("openai/gpt-oss-120b"),
      instructions: "You are a helpful assistant.",
      messages,
      // Stop and cancel abort the model call, not just the UI stream.
      abortSignal: signal,
      // gpt-oss reasons before it writes a single visible token. Groq defaults
      // that to "medium", which adds tens of seconds of silence to every reply.
      providerOptions: { groq: { reasoningEffort: "low" } },
    }),
})
