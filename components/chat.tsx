"use client"

import { useChat } from "@ai-sdk/react"
import {
  useLoadTranscript,
  useTriggerChatTransport,
} from "@trigger.dev/sdk/chat/react"
import type { TriggerChatTransport } from "@trigger.dev/sdk/chat"
import type { UIMessage } from "ai"
import { CopyIcon, MessageSquareIcon, RefreshCcwIcon } from "lucide-react"
import { useState } from "react"

import type { chatAgent } from "@/Trigger/chat"
import {
  loadChatTranscript,
  mintChatAccessToken,
  startChatSession,
} from "@/actions/chat"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input"
import { Shimmer } from "@/components/ai-elements/shimmer"
import { Skeleton } from "@/components/ui/skeleton"

type ChatProps = {
  chatId: string
  className?: string
}

// Only text parts are rendered, so this is also what decides whether the bot
// has actually said anything yet.
function messageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")
}

function Chat({ chatId, className }: ChatProps) {
  const transport = useTriggerChatTransport<typeof chatAgent>({
    task: "chat",
    accessToken: ({ chatId }) => mintChatAccessToken(chatId),
    startSession: ({ chatId, clientData }) =>
      startChatSession({ chatId, clientData }),
  })

  // The transcript is persisted by chatId, so history survives a reload.
  const { messages, isLoading } = useLoadTranscript(
    chatId,
    loadChatTranscript,
    { transport }
  )

  // The transcript round-trips through Clerk, Postgres and Trigger before it
  // resolves, so show the chat shell instead of a blank screen.
  if (isLoading) {
    return <ChatLoading className={className} />
  }

  return (
    <ChatConversation
      key={chatId}
      chatId={chatId}
      className={className}
      transport={transport}
      initialMessages={messages}
    />
  )
}

type ChatLoadingProps = {
  className?: string
}

function ChatLoading({ className }: ChatLoadingProps) {
  return (
    <div className={className}>
      <div className="flex flex-1 flex-col gap-8 px-6 py-4 md:px-10">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
      <div className="shrink-0 px-6 py-4 md:px-10">
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  )
}

type ChatConversationProps = ChatProps & {
  transport: TriggerChatTransport
  initialMessages: UIMessage[]
}

function ChatConversation({
  chatId,
  className,
  transport,
  initialMessages,
}: ChatConversationProps) {
  const { messages, sendMessage, status, stop, error, regenerate } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    resume: initialMessages.length > 0,
  })
  const [input, setInput] = useState("")

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim()

    if (!text) {
      return
    }

    sendMessage({ text })
    setInput("")
  }

  const lastMessage = messages[messages.length - 1]
  // Reasoning tokens stream before the first word, so a "streaming" assistant
  // message can still be empty. Treat that as loading too.
  const isThinking =
    status === "submitted" ||
    (status === "streaming" &&
      lastMessage?.role === "assistant" &&
      messageText(lastMessage).length === 0)

  return (
    <div className={className}>
      <Conversation>
        <ConversationContent className="px-6 md:px-10">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<MessageSquareIcon className="size-8" />}
              title="Start the conversation"
              description="Send a message to get a response."
            />
          ) : (
            messages.map((message, messageIndex) => {
              const isLastMessage = messageIndex === messages.length - 1
              const text = messageText(message)
              const isPendingReply =
                isThinking && isLastMessage && message.role === "assistant"

              return (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {isPendingReply ? (
                      <Shimmer>Thinking…</Shimmer>
                    ) : (
                      <MessageResponse>{text}</MessageResponse>
                    )}
                  </MessageContent>
                  {message.role === "assistant" &&
                  isLastMessage &&
                  !isThinking ? (
                    <MessageActions>
                      <MessageAction
                        label="Copy"
                        tooltip="Copy response"
                        onClick={() => {
                          void navigator.clipboard.writeText(text)
                        }}
                      >
                        <CopyIcon className="size-3" />
                      </MessageAction>
                      <MessageAction
                        label="Regenerate"
                        tooltip="Regenerate response"
                        disabled={status === "streaming"}
                        onClick={() => regenerate()}
                      >
                        <RefreshCcwIcon className="size-3" />
                      </MessageAction>
                    </MessageActions>
                  ) : null}
                </Message>
              )
            })
          )}
          {isThinking && lastMessage?.role !== "assistant" ? (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="shrink-0 px-6 py-4 md:px-10">
        {error ? (
          <p className="mb-2 text-sm text-destructive">
            Something went wrong. Please try again.
          </p>
        ) : null}
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(event) => setInput(event.currentTarget.value)}
              placeholder="Send a message..."
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputSubmit
              status={status}
              onStop={stop}
              disabled={!input.trim()}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  )
}

export { Chat }
