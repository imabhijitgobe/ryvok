import { Avatar as DiceBearAvatar, Style } from "@dicebear/core"
import gaze from "@dicebear/styles/gaze.json" with { type: "json" }
import Image from "next/image"

const style = new Style(gaze)

function toDataUri(svg: string) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

type ChatAvatarProps = {
  seed: string
  animated?: boolean
  className?: string
}

function ChatAvatar({ seed, animated = false, className }: ChatAvatarProps) {
  const svg = new DiceBearAvatar(style, {
    seed,
    ...(animated ? { tags: ["animation"] } : {}),
  }).toString()

  return (
    <Image
      src={toDataUri(svg)}
      alt={`Avatar for ${seed}`}
      width={32}
      height={32}
      className={className}
    />
  )
}

export { ChatAvatar }