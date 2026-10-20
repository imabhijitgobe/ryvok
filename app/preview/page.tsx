import { ChatHeader } from "@/components/chat-header"

const previewBot = {
  id: "preview-bot",
  name: "Quill",
  avatar: "test-seed",
  job: "Writing editor",
  instructions: "Cut the fat, keep the voice, and explain every change.",
}

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <ChatHeader title="Quill" avatar="test-seed" bot={previewBot} />
    </div>
  )
}
